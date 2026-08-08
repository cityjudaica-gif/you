const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
    // Разрешаем только POST
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { url, format } = req.body;
        if (!url) {
            return res.status(400).send('Missing url');
        }

        if (!ytdl.validateURL(url)) {
            return res.status(400).send('Invalid YouTube URL');
        }

        const info = await ytdl.getInfo(url);
        // Очищаем имя файла от недопустимых символов
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');

        if (format === 'mp4') {
            // Видео – берём качество 360p (быстро и укладывается в лимиты Vercel)
            // Если нужно выше – замените на 'highestvideo', но тогда могут быть таймауты
            const stream = ytdl(url, { quality: 'lowest' }); // или '18' для 360p
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
            stream.pipe(res);
        } else if (format === 'mp3') {
            // Аудио – отдаём в формате M4A (AAC) без конвертации
            const stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
            res.setHeader('Content-Type', 'audio/mp4'); // M4A
            res.setHeader('Content-Disposition', `attachment; filename="${title}.m4a"`);
            stream.pipe(res);
        } else {
            res.status(400).send('Invalid format. Use mp4 or mp3');
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Error: ' + error.message);
    }
};
