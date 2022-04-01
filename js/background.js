const images = ["0.jpg", "1.jpg", "2.jpg"]

const selectionImage = images[Math.floor(Math.random() * images.length)]

//html element 만들기
// const bgImage = document.createElement("img")
// bgImage.src = `img/${selectionImage}`;

//html 요소 삽입
// document.body.appendChild(bgImage)

//스타일덮어쓰기
document.body.style.backgroundImage = `url("img/${selectionImage}")`
document.body.style.backgroundSize = "cover"
document.body.style.height = "100vh"

