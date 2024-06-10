// Клиент
const ws = new WebSocket("ws://localhost:3000");

ws.onopen = function () {
  console.log("подключился");
};

function sendKeyword() {
  let keyword = document.querySelector("#keyword").value;
  ws.send(keyword);
}

ws.addEventListener("message", async (data) => {
  try {
    let urls = JSON.parse(data.data);
    let urlsDiv = document.querySelector("#urls");
    let statusDiv = document.querySelector("#status");
    let contentDiv = document.querySelector("#content");
    let contentDivBtn = document.querySelector("#contentBtn");

    // Отображение URL
    urlsDiv.innerHTML = "";
    if (urls.length > 0) {
      urls.forEach((urlData, index) => {
        let buttonUrl = document.createElement("button");
        buttonUrl.textContent = urlData.url;
        buttonUrl.onclick = () => downloadContent(urlData, index);
        urlsDiv.appendChild(buttonUrl);
      });
    } else {
      alert("По данному ключевому слову не найдены url");
    }

    async function downloadContent(urlData, index) {
      contentDiv.innerHTML = '';
      let fileExt = urlData.url.match(/\.([^.]+)$|$/)[1];
      let responseType = fileExt == 'jpg' ? 'blob' : 'text';
      try {
        // Многопоточное скачивание с отслеживанием прогресса
        let response = await axios.get(urlData.url, {
          responseType: responseType,
          onDownloadProgress: (progressEvent) => {
            let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            statusDiv.className = 'wrap-block';
            statusDiv.textContent = `Загружено: ${percentCompleted}%. Размер: ${urlData.size} байт. Количество потоков: ${urlData.threads}`;
          },
        });

        // Сохранение в LocalStorage
        if (fileExt == 'jpg') {
          let blobUrl = URL.createObjectURL(response.data);
          localStorage.setItem(`content${index}`, blobUrl);
        } else {
          localStorage.setItem(`content${index}`, response.data);
        }
        
        // Отображение загруженного контента
        let buttonContent = document.createElement("button");
        buttonContent.textContent = `Показать контент`;
        contentDivBtn.innerHTML = '';
        contentDivBtn.appendChild(buttonContent);

        buttonContent.onclick = () => {
          let content = localStorage.getItem(`content${index}`);
          contentDiv.innerHTML = '';
          if (content.startsWith('blob:')) {
            let img = document.createElement('img');
            img.src = content;
            contentDiv.appendChild(img);
          } else {
            contentDiv.textContent = content;
          }
        };
      } catch (error) {
        alert(`Ошибка при загрузке контента: ${error}`);
      }
    }
  } catch (error) {
    alert(`Ошибка при обработке сообщения: ${error}`);
  }
});

ws.addEventListener("error", (error) => {
  alert(`Ошибка WebSocket: ${error}`);
});
