const clock = document.querySelector("h2#clock")

clock.innerText = "00:00:00"

//string.padStart(숫자, '문자') 해당 스트링을 숫자의 글자수로 맞추고 빈공간은 '문자'로 채움
//"hello".padStart(10,'x') = "xxxxxhello"

function sayHello()
{
    const date = new Date();
    clock.innerText =(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds().toString().padStart(2,'0')}`)
}

//매 설정시간 반복 (반복할요소, 시간(ms))
sayHello()
setInterval(sayHello,1000)