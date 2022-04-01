const quotes = [
    {
        quote:"HockSi Action'e OTho K doyNoonGe A Say Yo?",
        author:"No HongFe"
    },
    {
        quote:"MuHan~",
        author:"No HongFe"
    },
    {
        quote:"Muyaho~",
        author:"Kim SangDuck"
    },
    {
        quote:"Goo Man Koom Sin Na Shin DaNoon Go GE",
        author:"Jung  HyunDon"
    },
]

const quote = document.querySelector("#quote span:first-child")
const author = document.querySelector("#quote span:last-child")

//math.round : 반올림
//math.ceil : 올림
//math.floor : 버림

function deployQuote(){
    const len = quotes.length;
    const rand = Math.floor(Math.random() * len);
    quote.innerText = quotes[rand].quote;
    author.innerText = quotes[rand].author;
}

deployQuote()