import {
    Store,
    ProductFolder,
    Demand,
    DemandPosition,
    Product,
    MoyskladResponse,
    MoyskladSettings,
} from '../types';

// Базовый URL для API (используем прокси для обхода CORS)
const API_BASE_URL = '/api/moysklad';

export class MoyskladApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = 'MoyskladApiError';
    }
}

import { API_RETRY_ATTEMPTS, API_RETRY_DELAY_BASE, API_RETRY_DELAY_MAX } from '../constants';
import { logger } from './logger';

// Retry-логика для сетевых ошибок
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const isRetryableError = (error: unknown): boolean => {
    if (error instanceof MoyskladApiError) {
        // Повторяем попытки для сетевых ошибок и ошибок лимита запросов
        return error.status === 429 || error.status === undefined;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return true;
    }
    return false;
};

// Выполнение запроса к API через прокси с retry-логикой
const fetchApi = async <T>(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {},
    retries: number = API_RETRY_ATTEMPTS
): Promise<T> => {
    // Используем прокси-сервер для обхода CORS
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                let errorCode: string | undefined;

                try {
                    const errorData = await response.json();
                    if (errorData.errors && errorData.errors.length > 0) {
                        errorMessage = errorData.errors.map((e: any) => e.error || e.message).join(', ');
                        errorCode = errorData.errors[0]?.code;
                    }
                } catch {
                    // Игнорируем ошибки парсинга ошибки
                }

                if (response.status === 401) {
                    throw new MoyskladApiError('Неверный токен доступа. Проверьте токен и попробуйте снова.', 401, errorCode);
                }

                if (response.status === 403) {
                    throw new MoyskladApiError('Доступ запрещен. Проверьте права доступа токена.', 403, errorCode);
                }

                if (response.status === 429) {
                    // Для ошибки лимита запросов делаем retry с экспоненциальной задержкой
                    if (attempt < retries) {
                        const delay = Math.min(API_RETRY_DELAY_BASE * Math.pow(2, attempt), API_RETRY_DELAY_MAX);
                        logger.warn(`Превышен лимит запросов, повтор через ${delay}мс (попытка ${attempt + 1}/${retries + 1})`);
                        await sleep(delay);
                        continue;
                    }
                    throw new MoyskladApiError('Превышен лимит запросов. Подождите немного и попробуйте снова.', 429, errorCode);
                }

                throw new MoyskladApiError(errorMessage, response.status, errorCode);
            }

            // Если ответ пустой (например, при удалении)
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return {} as T;
            }

            return await response.json();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (error instanceof MoyskladApiError) {
                // Не повторяем попытки для ошибок авторизации и доступа
                if (error.status === 401 || error.status === 403) {
                    throw error;
                }
            }

            // Если это retryable ошибка и есть еще попытки, повторяем
            if (isRetryableError(error) && attempt < retries) {
                const delay = Math.min(API_RETRY_DELAY_BASE * Math.pow(2, attempt), API_RETRY_DELAY_MAX);
                logger.warn(`Сетевая ошибка, повтор через ${delay}мс (попытка ${attempt + 1}/${retries + 1}):`, error);
                await sleep(delay);
                continue;
            }

            // Если это не retryable ошибка или закончились попытки, пробрасываем ошибку
            if (error instanceof MoyskladApiError) {
                throw error;
            }

            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new MoyskladApiError('Ошибка сети. Проверьте подключение к интернету.');
            }

            throw new MoyskladApiError(`Неожиданная ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Если дошли сюда, значит все попытки исчерпаны
    throw lastError || new MoyskladApiError('Не удалось выполнить запрос после нескольких попыток');
};

// Получение списка розничных точек продажи
export const getStores = async (accessToken: string): Promise<Store[]> => {
    try {
        // Используем retailstore для розничных точек продажи
        const response = await fetchApi<MoyskladResponse<Store>>(
            '/entity/retailstore?limit=100',
            accessToken
        );
        return response.rows || [];
    } catch (error) {
        logger.error('Ошибка при получении розничных точек продажи:', error);
        throw error;
    }
};

// Получение списка групп товаров
export const getProductFolders = async (accessToken: string): Promise<ProductFolder[]> => {
    try {
        const response = await fetchApi<MoyskladResponse<ProductFolder>>(
            '/entity/productfolder?limit=100',
            accessToken
        );
        return response.rows || [];
    } catch (error) {
        logger.error('Ошибка при получении групп товаров:', error);
        throw error;
    }
};

// Получение розничных продаж за день с фильтрацией по retailstore и дате
export const getDemandsByDate = async (
    accessToken: string,
    date: string,
    storeId: string
): Promise<Demand[]> => {
    try {
        // Форматируем дату для фильтра (начало и конец дня)
        const startDate = `${date} 00:00:00`;
        const endDate = `${date} 23:59:59`;
        // Используем полный URL для фильтра retailstore (розничная точка продажи)
        const storeHref = `https://api.moysklad.ru/api/remap/1.2/entity/retailstore/${storeId}`;

        // Фильтр: дата в диапазоне и определенная розничная точка продажи
        // Используем retaildemand для розничных продаж
        const filter = `moment>=${startDate};moment<=${endDate};retailStore=${storeHref}`;
        const endpoint = `/entity/retaildemand?filter=${encodeURIComponent(filter)}&limit=1000`;

        const response = await fetchApi<MoyskladResponse<Demand>>(
            endpoint,
            accessToken
        );
        return response.rows || [];
    } catch (error) {
        logger.error('Ошибка при получении розничных продаж:', error);
        throw error;
    }
};

// Получение позиций розничной продажи с товарами (expand=assortment для получения товаров сразу)
export const getDemandPositions = async (
    accessToken: string,
    demandId: string,
    expandAssortment: boolean = false
): Promise<DemandPosition[]> => {
    try {
        // Используем retaildemand для розничных продаж
        // Если нужно получить товары, используем expand=assortment
        const endpoint = expandAssortment
            ? `/entity/retaildemand/${demandId}/positions?limit=1000&expand=assortment`
            : `/entity/retaildemand/${demandId}/positions?limit=1000`;

        const response = await fetchApi<MoyskladResponse<DemandPosition>>(
            endpoint,
            accessToken
        );
        return response.rows || [];
    } catch (error) {
        logger.error('Ошибка при получении позиций розничной продажи:', error);
        throw error;
    }
};

// Получение товара по href или ID
export const getProduct = async (
    accessToken: string,
    productHref: string
): Promise<Product> => {
    try {
        // Если это полный URL, делаем запрос напрямую к нему
        if (productHref.startsWith('http')) {
            // Извлекаем путь из полного URL для использования прокси
            const url = new URL(productHref);
            const path = url.pathname + (url.search || '');
            // Заменяем полный путь API на наш прокси путь
            const proxyPath = path.replace('/api/remap/1.2', '/api/moysklad');
            const response = await fetch(proxyPath, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                let errorCode: string | undefined;
                try {
                    const errorData = await response.json();
                    if (errorData.errors && errorData.errors.length > 0) {
                        errorMessage = errorData.errors.map((e: any) => e.error || e.message).join(', ');
                        errorCode = errorData.errors[0]?.code;
                    }
                } catch {
                    // Игнорируем ошибки парсинга ошибки
                }
                throw new MoyskladApiError(errorMessage, response.status, errorCode);
            }

            return await response.json();
        }

        // Если это только ID или относительный путь, используем обычный метод
        const id = productHref.includes('/')
            ? productHref.split('/').pop() || productHref
            : productHref;

        return await fetchApi<Product>(
            `/entity/product/${id}`,
            accessToken
        );
    } catch (error) {
        if (error instanceof MoyskladApiError) {
            throw error;
        }
        logger.error('Ошибка при получении товара:', error);
        throw error;
    }
};

// Проверка, является ли товар целевым продуктом (проверяем атрибут "Целевой продукт" = true)
const isTargetProduct = (product: Product): boolean => {
    if (!product.attributes || product.attributes.length === 0) {
        return false;
    }

    // Ищем атрибут с именем "Целевой продукт" и значением true
    const targetAttribute = product.attributes.find(
        attr => attr.name === 'Целевой продукт' && attr.value === true
    );

    return targetAttribute !== undefined;
};

// Проверка, не является ли товар товаром табаконистов (исключаем из подсчета)
const isTobaccoStoreProduct = (product: Product): boolean => {
    // Если у товара есть pathName и он начинается с "Сигаретная продукция/Сигаретная продукция (табаконисты)", исключаем
    if (product.pathName && product.pathName.startsWith('Сигаретная продукция/Сигаретная продукция (табаконисты)')) {
        return true;
    }
    return false;
};

// Получение товара из позиции (используется expand=assortment или отдельный запрос)
const getProductFromPosition = async (
    accessToken: string,
    position: DemandPosition
): Promise<Product | null> => {
    // Если позиция содержит полный объект товара (expand=assortment)
    const assortment = position.assortment as any;

    // Проверяем, что это объект (не meta ссылка)
    if (assortment && typeof assortment === 'object') {
        // Если есть id и name, это уже полный объект товара
        if ('id' in assortment && 'name' in assortment && !('type' in assortment && assortment.type === 'attributemetadata')) {
            return assortment as Product;
        }

        // Если есть meta с href, получаем товар отдельным запросом
        if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
            try {
                const productHref = assortment.meta.href;
                return await getProduct(accessToken, productHref);
            } catch (error) {
                logger.warn('Не удалось получить товар для позиции:', { positionId: position.id, error });
                return null;
            }
        }
    }

    return null;
};

// Подсчет розничных продаж за день (исключаем товары табаконистов)
export const calculateSalesByDay = async (
    accessToken: string,
    date: string,
    storeId: string
): Promise<{ count: number; total: number }> => {
    try {
        const demands = await getDemandsByDate(accessToken, date, storeId);

        // Подсчитываем только применимые розничные продажи (applicable = true)
        const applicableDemands = demands.filter(d => d.applicable !== false);

        // Параллельно загружаем позиции для всех отгрузок
        const positionsPromises = applicableDemands.map(demand =>
            getDemandPositions(accessToken, demand.id, true)
                .then(positions => ({ demand, positions }))
                .catch(error => {
                    logger.warn('Не удалось получить позиции для отгрузки:', { demandId: demand.id, error });
                    return { demand, positions: [], error };
                })
        );

        const demandsWithPositions = await Promise.all(positionsPromises);

        let total = 0;
        let validDemandsCount = 0;

        // Обрабатываем каждую отгрузку с позициями
        for (const item of demandsWithPositions) {
            if ('error' in item) {
                // Если не удалось получить позиции, учитываем всю сумму отгрузки (на случай ошибки API)
                total += item.demand.sum || 0;
                validDemandsCount++;
                continue;
            }
            
            const { demand, positions } = item;

            // Начинаем с общей суммы отгрузки (demand.sum включает все позиции с учетом скидок/налогов)
            let demandTotal = demand.sum || 0;

            // Вычитаем сумму товаров табаконистов из общей суммы
            let tobaccoProductsSum = 0;

            // Собираем позиции, для которых нужны дополнительные запросы товаров
            const productPromises: Promise<Product | null>[] = [];
            const positionIndices: number[] = [];

            for (let i = 0; i < positions.length; i++) {
                const position = positions[i];
                const assortment = position.assortment as any;

                // Проверяем тип ассортимента
                let isProduct = false;
                if (assortment && typeof assortment === 'object') {
                    // Если это полный объект товара (expand=assortment)
                    if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
                        isProduct = true;
                    } else if ('id' in assortment && 'name' in assortment && !('meta' in assortment && assortment.meta?.type === 'service')) {
                        // Если это объект товара без meta, тоже считаем товаром
                        isProduct = true;
                    }
                }

                if (!isProduct) {
                    continue; // Услуги и комплекты не проверяем
                }

                // Проверяем, нужен ли отдельный запрос товара
                if ('id' in assortment && 'name' in assortment && !('meta' in assortment && assortment.meta?.type === 'service')) {
                    // Товар уже включен в позицию
                    const product = assortment as Product;
                    if (isTobaccoStoreProduct(product)) {
                        const positionSum = position.sum || (position.price * position.quantity) || 0;
                        tobaccoProductsSum += positionSum;
                    }
                } else if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
                    // Нужен отдельный запрос товара
                    positionIndices.push(i);
                    productPromises.push(getProductFromPosition(accessToken, position));
                }
            }

            // Параллельно загружаем товары для позиций, которые требуют отдельного запроса
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

            // Вычитаем сумму товаров табаконистов из общей суммы отгрузки
            demandTotal = Math.max(0, demandTotal - tobaccoProductsSum);

            // Если после вычитания сумма больше нуля, учитываем отгрузку
            if (demandTotal > 0) {
                total += demandTotal;
                validDemandsCount++;
            }
        }

        return { count: validDemandsCount, total };
    } catch (error) {
        logger.error('Ошибка при подсчете розничных продаж:', error);
        throw error;
    }
};

// Подсчет целевых продуктов за день из розничных продаж
export const calculateTargetProductsByDay = async (
    accessToken: string,
    date: string,
    settings: MoyskladSettings
): Promise<number> => {
    try {
        if (!settings.storeId) {
            return 0;
        }

        const demands = await getDemandsByDate(accessToken, date, settings.storeId);
        const applicableDemands = demands.filter(d => d.applicable !== false);

        // Параллельно загружаем позиции для всех отгрузок
        const positionsPromises = applicableDemands.map(demand =>
            getDemandPositions(accessToken, demand.id, true)
                .then(positions => ({ demand, positions }))
                .catch(error => {
                    logger.warn('Не удалось получить позиции для розничной продажи:', { demandId: demand.id, error });
                    return { demand, positions: [] };
                })
        );

        const demandsWithPositions = await Promise.all(positionsPromises);

        let totalQuantity = 0;

        // Обрабатываем каждую розничную продажу с позициями
        for (const { positions } of demandsWithPositions) {
            // Собираем позиции, для которых нужны дополнительные запросы товаров
            const productPromises: Promise<Product | null>[] = [];
            const positionIndices: number[] = [];
            const positionQuantities: number[] = [];

            for (let i = 0; i < positions.length; i++) {
                const position = positions[i];
                const assortment = position.assortment as any;

                // Проверяем тип ассортимента
                let isProduct = false;
                if (assortment && typeof assortment === 'object') {
                    // Если это полный объект товара (expand=assortment)
                    if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
                        isProduct = true;
                    } else if ('id' in assortment && 'name' in assortment && !('meta' in assortment && assortment.meta?.type === 'service')) {
                        // Если это объект товара без meta, тоже считаем товаром
                        isProduct = true;
                    }
                }

                if (!isProduct) {
                    continue; // Услуги и комплекты не проверяем
                }

                // Проверяем, нужен ли отдельный запрос товара
                if ('id' in assortment && 'name' in assortment && !('meta' in assortment && assortment.meta?.type === 'service')) {
                    // Товар уже включен в позицию
                    const product = assortment as Product;
                    // Исключаем товары табаконистов
                    if (!isTobaccoStoreProduct(product) && isTargetProduct(product)) {
                        totalQuantity += position.quantity || 0;
                    }
                } else if ('meta' in assortment && assortment.meta && assortment.meta.type === 'product') {
                    // Нужен отдельный запрос товара
                    positionIndices.push(i);
                    positionQuantities.push(position.quantity || 0);
                    productPromises.push(getProductFromPosition(accessToken, position));
                }
            }

            // Параллельно загружаем товары для позиций, которые требуют отдельного запроса
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
        logger.error('Ошибка при подсчете целевых продуктов:', error);
        throw error;
    }
};

// Тест подключения к API
export const testConnection = async (accessToken: string): Promise<boolean> => {
    // Пробуем получить список розничных точек продажи с минимальным лимитом (это простой запрос для проверки токена)
    // Используем limit=1 для минимальной нагрузки на API
    try {
        await fetchApi<MoyskladResponse<Store>>(
            '/entity/retailstore?limit=1',
            accessToken
        );
        return true;
    } catch (error) {
        // Обрабатываем ошибки авторизации
        if (error instanceof MoyskladApiError) {
            if (error.status === 401) {
                throw new MoyskladApiError('Неверный токен доступа. Проверьте токен и попробуйте снова.', 401, error.code);
            }
            if (error.status === 403) {
                throw new MoyskladApiError('Доступ запрещен. Проверьте права доступа токена.', 403, error.code);
            }
            // Для других ошибок API пробрасываем их как есть
            throw error;
        }

        // Для неизвестных ошибок
        logger.error('Ошибка при тесте подключения:', error);
        throw new MoyskladApiError('Не удалось проверить подключение. Проверьте токен и попробуйте снова.');
    }
};
