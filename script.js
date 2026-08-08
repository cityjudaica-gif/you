document.getElementById('downloadForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const url = document.getElementById('urlInput').value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;
    const status = document.getElementById('status');

    if (!url) {
        status.textContent = 'Пожалуйста, введите ссылку.';
        return;
    }

    status.textContent = 'Загрузка...';

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, format }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Ошибка сервера');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        // Из заголовка Content-Disposition пытаемся получить имя файла
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `download.${format === 'mp4' ? 'mp4' : 'mp3'}`;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) filename = match[1];
        }
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        status.textContent = 'Скачивание завершено!';
    } catch (error) {
        status.textContent = `Ошибка: ${error.message}`;
        console.error(error);
    }
});
