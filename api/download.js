const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { url, format } = req.body;
        if (!url) {
            return res.status(400).send('Missing URL');
        }

        // Проверяем валидность URL
        if (!ytdl.validateURL(url)) {
            return res.status(400).send('Invalid YouTube URL');
        }

        // Пытаемся получить информацию о видео
        let info;
        try {
            info = await ytdl.getInfo(url);
        } catch (err) {
            // Обрабатываем специфические ошибки ytdl-core
            if (err.message && err.message.includes('410')) {
                return res.status(410).send('Video is unavailable (gone)');
            }
            if (err.statusCode === 403) {
                return res.status(403).send('Access forbidden (region block or age restriction)');
            }
            // Другие ошибки
            console.error('ytdl error:', err);
            return res.status(500).send('Failed to fetch video info: ' + err.message);
        }

        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');

        if (format === 'mp4') {
            // Видео – используем качество 360p (быстро)
            const stream = ytdl(url, { quality: 'lowest' });
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
            stream.pipe(res);
        } else if (format === 'mp3') {
            // Аудио – M4A (без конвертации)
            const stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
            res.setHeader('Content-Type', 'audio/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.m4a"`);
            stream.pipe(res);
        } else {
            res.status(400).send('Invalid format');
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Internal server error: ' + error.message);
    }
};
