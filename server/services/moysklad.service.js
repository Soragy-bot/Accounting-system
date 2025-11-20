import https from 'https';
import { MoyskladSettings } from '../models/MoyskladSettings.js';
import { decrypt } from './encryption.service.js';

const API_BASE_URL = 'https://api.moysklad.ru/api/remap/1.2';

class MoyskladApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'MoyskladApiError';
    this.status = status;
    this.code = code;
  }
}

const fetchApi = async (endpoint, accessToken, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (res.statusCode === 204 || data.length === 0) {
            resolve({});
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            resolve({});
          }
        } else {
          let errorMessage = `HTTP ${res.statusCode}: ${res.statusMessage}`;
          let errorCode;
          
          try {
            const errorData = JSON.parse(data);
            if (errorData.errors && errorData.errors.length > 0) {
              errorMessage = errorData.errors.map(e => e.error || e.message).join(', ');
              errorCode = errorData.errors[0]?.code;
            }
          } catch {
            // Игнорируем ошибки парсинга
          }

          reject(new MoyskladApiError(errorMessage, res.statusCode, errorCode));
        }
      });
    });

    req.on('error', (error) => {
      reject(new MoyskladApiError(`Network error: ${error.message}`));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
};

const isTargetProduct = (product) => {
  if (!product.attributes || product.attributes.length === 0) {
    return false;
  }
  const targetAttribute = product.attributes.find(
    attr => attr.name === 'Целевой продукт' && attr.value === true
  );
  return targetAttribute !== undefined;
};

const isTobaccoStoreProduct = (product) => {
  if (product.pathName && product.pathName.startsWith('Сигаретная продукция/Сигаретная продукция (табаконисты)')) {
    return true;
  }
  return false;
};

export class MoyskladService {
  static async getAccessToken() {
    const settings = await MoyskladSettings.findLatest();
    if (!settings || !settings.encrypted_token) {
      throw new Error('Moysklad settings not configured');
    }
    return decrypt(settings.encrypted_token);
  }

  static async getStores() {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetchApi('/entity/retailstore?limit=100', accessToken);
      return response.rows || [];
    } catch (error) {
      console.error('Error getting stores:', error);
      throw error;
    }
  }

  static async testConnection() {
    try {
      const accessToken = await this.getAccessToken();
      await fetchApi('/entity/retailstore?limit=1', accessToken);
      return true;
    } catch (error) {
      if (error instanceof MoyskladApiError) {
        if (error.status === 401) {
          throw new MoyskladApiError('Неверный токен доступа', 401);
        }
        if (error.status === 403) {
          throw new MoyskladApiError('Доступ запрещен', 403);
        }
      }
      throw error;
    }
  }

  static async getDemandsByDate(date, storeId) {
    try {
      const accessToken = await this.getAccessToken();
      const startDate = `${date} 00:00:00`;
      const endDate = `${date} 23:59:59`;
      const storeHref = `https://api.moysklad.ru/api/remap/1.2/entity/retailstore/${storeId}`;
      const filter = `moment>=${startDate};moment<=${endDate};retailStore=${storeHref}`;
      const endpoint = `/entity/retaildemand?filter=${encodeURIComponent(filter)}&limit=1000`;
      
      const response = await fetchApi(endpoint, accessToken);
      return response.rows || [];
    } catch (error) {
      console.error('Error getting demands:', error);
      throw error;
    }
  }

  static async getDemandPositions(demandId, expandAssortment = false) {
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = expandAssortment
        ? `/entity/retaildemand/${demandId}/positions?limit=1000&expand=assortment`
        : `/entity/retaildemand/${demandId}/positions?limit=1000`;
      
      const response = await fetchApi(endpoint, accessToken);
      return response.rows || [];
    } catch (error) {
      console.error('Error getting demand positions:', error);
      throw error;
    }
  }

  static async getProduct(productHref) {
    try {
      const accessToken = await this.getAccessToken();
      
      if (productHref.startsWith('http')) {
        const url = new URL(productHref);
        const path = url.pathname + (url.search || '');
        const response = await fetchApi(path, accessToken);
        return response;
      }

      const id = productHref.includes('/')
        ? productHref.split('/').pop() || productHref
        : productHref;

      return await fetchApi(`/entity/product/${id}`, accessToken);
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  static async getProductFromPosition(position) {
    const assortment = position.assortment;

    if (assortment && typeof assortment === 'object') {
      if ('id' in assortment && 'name' in assortment && !('type' in assortment && assortment.type === 'attributemetadata')) {
        return assortment;
      }

      if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
        try {
          const productHref = assortment.meta.href;
          return await this.getProduct(productHref);
        } catch (error) {
          console.warn('Failed to get product for position:', error);
          return null;
        }
      }
    }

    return null;
  }

  static async calculateSalesByDay(date, storeId) {
    try {
      const demands = await this.getDemandsByDate(date, storeId);
      const applicableDemands = demands.filter(d => d.applicable !== false);

      const positionsPromises = applicableDemands.map(demand =>
        this.getDemandPositions(demand.id, true)
          .then(positions => ({ demand, positions }))
          .catch(error => {
            console.warn('Failed to get positions for demand:', error);
            return { demand, positions: [], error };
          })
      );

      const demandsWithPositions = await Promise.all(positionsPromises);

      let total = 0;
      let validDemandsCount = 0;

      for (const item of demandsWithPositions) {
        if ('error' in item) {
          total += item.demand.sum || 0;
          validDemandsCount++;
          continue;
        }

        const { demand, positions } = item;
        let demandTotal = demand.sum || 0;
        let tobaccoProductsSum = 0;

        const productPromises = [];
        const positionIndices = [];

        for (let i = 0; i < positions.length; i++) {
          const position = positions[i];
          const assortment = position.assortment;

          let isProduct = false;
          if (assortment && typeof assortment === 'object') {
            if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
              isProduct = true;
            } else if ('id' in assortment && 'name' in assortment && !('meta' in assortment && assortment.meta?.type === 'service')) {
              isProduct = true;
            }
          }

          if (!isProduct) {
            continue;
          }

          if ('id' in assortment && 'name' in assortment && !('meta' in assortment && assortment.meta?.type === 'service')) {
            const product = assortment;
            if (isTobaccoStoreProduct(product)) {
              const positionSum = position.sum || (position.price * position.quantity) || 0;
              tobaccoProductsSum += positionSum;
            }
          } else if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
            positionIndices.push(i);
            productPromises.push(this.getProductFromPosition(position));
          }
        }

        if (productPromises.length > 0) {
          const products = await Promise.all(productPromises);
          for (let j = 0; j < products.length; j++) {
            const product = products[j];
            if (product && isTobaccoStoreProduct(product)) {
              const positionIndex = positionIndices[j];
              const position = positions[positionIndex];
              const positionSum = position.sum || (position.price * position.quantity) || 0;
              tobaccoProductsSum += positionSum;
            }
          }
        }

        demandTotal = Math.max(0, demandTotal - tobaccoProductsSum);

        if (demandTotal > 0) {
          total += demandTotal;
          validDemandsCount++;
        }
      }

      return { count: validDemandsCount, total };
    } catch (error) {
      console.error('Error calculating sales by day:', error);
      throw error;
    }
  }

  static async calculateTargetProductsByDay(date, storeId) {
    try {
      const demands = await this.getDemandsByDate(date, storeId);
      const applicableDemands = demands.filter(d => d.applicable !== false);

      const positionsPromises = applicableDemands.map(demand =>
        this.getDemandPositions(demand.id, true)
          .then(positions => ({ demand, positions }))
          .catch(error => {
            console.warn('Failed to get positions for demand:', error);
            return { demand, positions: [] };
          })
      );

      const demandsWithPositions = await Promise.all(positionsPromises);

      let totalQuantity = 0;

      for (const { positions } of demandsWithPositions) {
        const productPromises = [];
        const positionIndices = [];
        const positionQuantities = [];

        for (let i = 0; i < positions.length; i++) {
          const position = positions[i];
          const assortment = position.assortment;

          let isProduct = false;
          if (assortment && typeof assortment === 'object') {
            if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
              isProduct = true;
            } else if ('id' in assortment && 'name' in assortment && !('meta' in assortment && assortment.meta?.type === 'service')) {
              isProduct = true;
            }
          }

          if (!isProduct) {
            continue;
          }

          if ('id' in assortment && 'name' in assortment && !('meta' in assortment && assortment.meta?.type === 'service')) {
            const product = assortment;
            if (!isTobaccoStoreProduct(product) && isTargetProduct(product)) {
              totalQuantity += position.quantity || 0;
            }
          } else if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
            positionIndices.push(i);
            positionQuantities.push(position.quantity || 0);
            productPromises.push(this.getProductFromPosition(position));
          }
        }

        if (productPromises.length > 0) {
          const products = await Promise.all(productPromises);
          for (let j = 0; j < products.length; j++) {
            const product = products[j];
            if (product && !isTobaccoStoreProduct(product) && isTargetProduct(product)) {
              totalQuantity += positionQuantities[j];
            }
          }
        }
      }

      return totalQuantity;
    } catch (error) {
      console.error('Error calculating target products by day:', error);
      throw error;
    }
  }
}

