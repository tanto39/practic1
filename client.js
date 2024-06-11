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
    let contentListDiv = document.querySelector("#contentList");
    let contentDiv = document.querySelector("#content");

    urlsDiv.innerHTML = "";
    contentDiv.innerHTML = "";

    // список url
    if (urls.length > 0) {
      urls.forEach((urlData, index) => {
        let buttonUrl = document.createElement("button");
        buttonUrl.textContent = urlData.url;
        buttonUrl.onclick = () => downloadContent(urlData);
        urlsDiv.append(buttonUrl);
      });
    } else {
      alert("По данному ключевому слову не найдены url");
    }

    // скачивание контента
    async function downloadContent(urlData) {
      let fileExt = urlData.url.match(/\.([^.]+)$|$/)[1];
      let responseType = fileExt == "jpg" ? "blob" : "text";
      try {
        let response = await axios.get(urlData.url, {
          responseType: responseType,
          onDownloadProgress: (progressEvent) => {
            let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            statusDiv.className = "wrap-block";
            statusDiv.textContent = `Загружено: ${percentCompleted}%. Размер: ${urlData.size} байт. Количество потоков: ${urlData.threads}`;
          },
        });

        if (fileExt == "jpg") {
          let blobUrl = URL.createObjectURL(response.data);
          localStorage.setItem(`content${urlData.url}`, blobUrl);
        } else {
          localStorage.setItem(`content${urlData.url}`, response.data);
        }

        let buttonContent = document.createElement("button");
        buttonContent.textContent = `Показать контент ${urlData.url}`;
        contentListDiv.append(buttonContent);

        buttonContent.onclick = () => {
          contentDiv.innerHTML = "";
          let content = localStorage.getItem(`content${urlData.url}`);
          if (content.startsWith("blob:")) {
            let img = document.createElement("img");
            img.src = content;
            contentDiv.append(img);
          } else {
            let text = document.createElement("p");
            text.textContent = content;
            contentDiv.append(text);
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
