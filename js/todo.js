const toDoForm = document.getElementById("todo-form")
const toDoInput = toDoForm.querySelector("input")
const toDoList = document.getElementById("todo-list")
const TODOSKEY = "todos"
let toDos = [];

//array유용한기능 
//foreach(function(element) 혹은 (element)=>{}) // 각요소에 대해서 설정한 작업을 취함
//filter(function(element) 혹은 (element)=>{}) // 각요소에 대해서 설정한 작업을 하고 true/false리턴 true시 array에 요소가 그대로 남고 false시 array에서 그 요소가 사라짐

function setLocalStorage(){
    localStorage.setItem(TODOSKEY,JSON.stringify(toDos));
}

function deleteToDo(event){
    const parent = event.target.parentNode;
    const id = parseInt(parent.id);
    toDos = toDos.filter((element)=>{
        return element.id !== id
    })
    setLocalStorage()
    parent.remove()
}

function imprintToDo(newTodo){
    const li = document.createElement("li");
    const span = document.createElement("span")
    const button = document.createElement("button")
    li.id = newTodo.id;
    span.innerText = newTodo.todo;
    button.innerText = "X"
    button.addEventListener("click", deleteToDo)
    li.appendChild(span);
    li.appendChild(button);
    toDoList.appendChild(li);
}

function handleToDoSubmit(event){
    event.preventDefault()
    const newTodo = {
        todo: toDoInput.value,
        id : Date.now(),
    };
    toDoInput.value = "";
    imprintToDo(newTodo)
    toDos.push(newTodo);
    setLocalStorage()
}

function initailizeToDo()
{
    let todos = localStorage.getItem(TODOSKEY)
    if (todos !== null)
    {
        toDos = JSON.parse(todos);
        toDos.forEach(imprintToDo);
    }
}

toDoForm.addEventListener("submit", handleToDoSubmit)

initailizeToDo()