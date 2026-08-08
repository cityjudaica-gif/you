const ytdl = require('ytdl-core');
const https = require('https');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { url, format } = req.body;
        if (!url) return res.status(400).send('Missing URL');
        if (!ytdl.validateURL(url)) return res.status(400).send('Invalid YouTube URL');

        // --- Настройка заголовков для имитации браузера ---
        const requestOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
            },
            // Если нужен прокси - раскомментируйте и укажите
            // agent: new https.Agent({ proxy: 'http://ваш-прокси:8080' })
        };

        // --- Получение информации с повторными попытками (на случай 410) ---
        let info;
        try {
            info = await ytdl.getInfo(url, { requestOptions });
        } catch (err) {
            // Если ошибка 410 - пробуем ещё раз без некоторых параметров или с другим качеством
            if (err.message.includes('410')) {
                // Можно попробовать получить информацию без дополнительных опций
                try {
                    info = await ytdl.getInfo(url);
                } catch (retryErr) {
                    console.error('Retry failed:', retryErr);
                    return res.status(410).send('Video unavailable (410) – возможно, удалено или региональный блок.');
                }
            } else {
                throw err; // пробрасываем другие ошибки
            }
        }

        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');

        // --- Формирование потока ---
        if (format === 'mp4') {
            const stream = ytdl(url, {
                quality: 'lowest',
                requestOptions,
            });
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
            stream.pipe(res);
        } else if (format === 'mp3') {
            const stream = ytdl(url, {
                quality: 'highestaudio',
                filter: 'audioonly',
                requestOptions,
            });
            res.setHeader('Content-Type', 'audio/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.m4a"`);
            stream.pipe(res);
        } else {
            res.status(400).send('Invalid format');
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Internal error: ' + error.message);
    }
};
