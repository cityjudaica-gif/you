const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { PassThrough } = require('stream');

ffmpeg.setFfmpegPath(ffmpegStatic);

module.exports = async (req, res) => {
    // Разрешаем только POST (можно также GET)
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const { url, format } = req.body;
    if (!url) {
        res.status(400).send('Missing url');
        return;
    }

    try {
        if (!ytdl.validateURL(url)) {
            res.status(400).send('Invalid YouTube URL');
            return;
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');

        if (format === 'mp4') {
            // Видео MP4
            const stream = ytdl(url, { quality: 'highestvideo' });
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
            stream.pipe(res);
        } else if (format === 'mp3') {
            // Аудио → MP3
            const audioStream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
            const command = ffmpeg(audioStream)
                .audioBitrate(128)
                .audioCodec('libmp3lame')
                .format('mp3')
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    if (!res.headersSent) {
                        res.status(500).send('Ошибка конвертации в MP3');
                    }
                });

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
            command.pipe(res, { end: true });
        } else {
            res.status(400).send('Неверный формат. Используйте mp4 или mp3');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
};
