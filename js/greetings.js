const loginForm = document.getElementById("login-form")
const loginInput = loginForm.querySelector("input")
const title = document.querySelector("#hello")

const HIDDEN_CLASSNAME = "displayNone"
const LOCALUSERKEY = "username"
//localstorage는 세팅되어있음 document처럼쓰면됨
//localstorage.setItem(키, 밸류) 로컬스토리지 데이터 세이브
//localstorage.getItem(키, 밸류) 로컬스토리지 데이터 가져오기 //데이터가없으면 null

function disableForm(value)
{
    loginForm.classList.add(HIDDEN_CLASSNAME)
    title.classList.remove(HIDDEN_CLASSNAME)
    title.innerText = `Hello ${value}`;
}

function onClickButton(event){
    event.preventDefault()
    const value = loginInput.value
    console.log(value)
    localStorage.setItem(LOCALUSERKEY, value)
    disableForm(value)
}

loginForm.addEventListener("submit", onClickButton)

function beforLoadPage()
{
    const localUser = localStorage.getItem(LOCALUSERKEY)
    if (localUser != null)
    {
        disableForm(localUser)
    }
}

beforLoadPage()
