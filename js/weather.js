//내 api 키 a2eb30c68671fea94e251f6066e321bb
//https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}
//https://api.openweathermap.org/data/2.5/weather?lat=37&lon=127&appid=a2eb30c68671fea94e251f6066e321bb

const APIKEY = "a2eb30c68671fea94e251f6066e321bb"
const weatherContainer = document.querySelector("#weather")

function onGeoOK(geo)
{
    //내위치 좌표 확인가능
    const lat = geo.coords.latitude //위도
    const lng = geo.coords.longitude //경도
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${APIKEY}&lang=kr&units=metric`
    //fetch -> 나대신 url에 요청후 응답받아옴 Promise임
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            const weather = weatherContainer.querySelector('span:first-child')
            const city = weatherContainer.querySelector(`span:last-child`)
            weather.innerText = data.weather[0].main
            city.innerText = data.name
        })
}
function onGeoKO()
{
    console.log("2Rr0r")
}


console.log(navigator.geolocation.getCurrentPosition(onGeoOK, onGeoKO));