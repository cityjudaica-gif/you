const ytdl = require('@distube/ytdl-core');

module.exports = async (req, res) => {
    // Разрешаем только POST
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { url, format } = req.body;
        if (!url) return res.status(400).send('Missing URL');

        // Валидация URL
        if (!ytdl.validateURL(url)) {
            return res.status(400).send('Invalid YouTube URL');
        }

        // Получаем информацию о видео с современными заголовками
        let info;
        try {
            info = await ytdl.getInfo(url, {
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                },
            });
        } catch (err) {
            console.error('getInfo error:', err);
            // Если ошибка 410 или 403 – возвращаем понятное сообщение
            if (err.statusCode === 410 || err.message.includes('410')) {
                return res.status(410).send('Видео недоступно (удалено, приватно или заблокировано в регионе)');
            }
            if (err.statusCode === 403) {
                return res.status(403).send('Доступ запрещён (возможно, возрастное ограничение)');
            }
            return res.status(500).send('Ошибка получения информации: ' + err.message);
        }

        // Очищаем имя файла
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');

        // Выбираем формат
        if (format === 'mp4') {
            // Видео – качество 360p (быстро и надёжно)
            const stream = ytdl.downloadFromInfo(info, {
                quality: 'lowest',
                filter: 'videoandaudio', // или 'videoonly' + 'audioonly' если нужно
            });
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
            stream.pipe(res);
        } else if (format === 'mp3') {
            // Аудио – отдаём в оригинальном формате (M4A/AAC)
            const stream = ytdl.downloadFromInfo(info, {
                quality: 'highestaudio',
                filter: 'audioonly',
            });
            res.setHeader('Content-Type', 'audio/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.m4a"`);
            stream.pipe(res);
        } else {
            res.status(400).send('Неверный формат');
        }
    } catch (error) {
        console.error('Global error:', error);
        res.status(500).send('Внутренняя ошибка сервера: ' + error.message);
    }
};
