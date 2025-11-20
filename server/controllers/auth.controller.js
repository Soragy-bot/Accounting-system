import { AuthService } from '../services/auth.service.js';
import { config } from '../config/env.js';

export const telegramAuth = (req, res) => {
    // Получаем домен из конфигурации
    // Для Telegram OAuth origin должен быть доменом без порта и пути
    // Домен должен быть зарегистрирован в настройках бота через @BotFather
    const domain = config.telegram.domain;

    if (!domain) {
        return res.status(500).json({ error: 'TELEGRAM_DOMAIN не настроен в переменных окружения' });
    }

    // Формируем origin (только домен) для Telegram OAuth
    // Telegram вернет данные на этот домен через query параметры
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'https';
    const origin = encodeURIComponent(`${protocol}://${domain}`);

    const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${config.telegram.clientId}&origin=${origin}&request_access=write`;

    res.redirect(telegramAuthUrl);
};

export const telegramCallback = async (req, res) => {
    try {
        // Telegram OAuth возвращает данные через query параметры или POST
        const authData = req.query || req.body;

        // Валидация данных от Telegram
        const telegramData = await AuthService.validateTelegramAuth(authData);

        // Поиск или создание пользователя
        const user = await AuthService.findOrCreateUser(telegramData);

        // Генерация токенов
        const tokens = await AuthService.generateTokens(user);

        // Устанавливаем токены в httpOnly cookies
        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 минут
        });

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
        });

        // Редирект на фронтенд с токенами в query (для первого сохранения в localStorage)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
    } catch (error) {
        console.error('Telegram callback error:', error);
        res.status(400).json({ error: error.message || 'Authentication failed' });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const tokens = await AuthService.refreshTokens(refreshToken);

        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
        });

        res.json({
            accessToken: tokens.accessToken,
            user: tokens.user,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ error: error.message || 'Invalid refresh token' });
    }
};

export const logout = (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
    try {
        // Пользователь уже добавлен в req через auth.middleware
        res.json({ user: req.user });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

