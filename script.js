document.getElementById('downloadForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;
    const status = document.getElementById('status');
    const submitBtn = document.getElementById('submitBtn');

    // Простая валидация URL YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!url || !youtubeRegex.test(url)) {
        status.innerHTML = '<span class="error">❌ Пожалуйста, введите корректную ссылку на YouTube.</span>';
        return;
    }

    // Блокируем кнопку и показываем загрузку
    submitBtn.disabled = true;
    submitBtn.textContent = 'Загрузка...';
    status.innerHTML = '<span class="loading"></span> Ожидание ответа от сервера...';

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, format }),
        });

        // Если ответ не OK – получаем текст ошибки
        if (!response.ok) {
            let errorText = await response.text();
            // Если ошибка 410 – добавляем пояснение
            if (response.status === 410) {
                errorText = '❌ Видео удалено, приватно или недоступно в вашем регионе. (410)';
            } else if (response.status === 400) {
                errorText = '❌ Неверный запрос: ' + errorText;
            } else if (response.status === 500) {
                errorText = '❌ Внутренняя ошибка сервера. Попробуйте позже.';
            }
            throw new Error(errorText);
        }

        // Получаем файл
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `download.${format === 'mp4' ? 'mp4' : 'm4a'}`;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) filename = match[1];
        }
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        status.innerHTML = '<span class="success">✅ Скачивание завершено!</span>';
    } catch (error) {
        status.innerHTML = `<span class="error">❌ Ошибка: ${error.message}</span>`;
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Скачать';
    }
});
