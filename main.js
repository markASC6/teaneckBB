/*
The flow is
Pre-processing:
    Main data structure:
        Question Set - array of 4 arrays representing the 4 books
        each of those arrays also have arrays representing each chapter
        e.g. if Jonah =  questionSet[0]
            Jonah = [[chap1_q1 chap1_q2 chap1_q3][chap2_q1 chap2_q2][...][...]]
            where chap1_q1 is a dictionary -> {question: q1, answer: a1, chapter: ch}
    Fill Question Set with questions from at least 1 csv
        PapaParse to parse the CSVs

User-interaction:
    Get question constraints from the user input on the webpage
    Main data structure:
        Question Bank - array of n question dictionaries
        n = number of questions user requested
    
*/

const Q = "Question";
const A = "Answer";
const CH = "Chapter";
const EXODUS = 0;
const JOHN = 1;
const ROMANS = 2;
const ESTHER = 3;
const MAX_CHAPTER_1 = 40;
const MAX_CHAPTER_2 = 21;
const MAX_CHAPTER_3 = 16;
const MAX_CHAPTER_4 = 10;

const EXODUS_CSV = 'data/exodusSample.csv';

// PRE-PROCESSING

let questionSet = [[],[],[],[]];
questionSet[EXODUS] = Array(MAX_CHAPTER_1).fill().map(() => []);     // array of empty arrays with one for each chapter
questionSet[JOHN] = Array(MAX_CHAPTER_2).fill().map(() => []);
questionSet[ROMANS] = Array(MAX_CHAPTER_3).fill().map(() => []);
questionSet[ESTHER] = Array(MAX_CHAPTER_4).fill().map(() => []);
console.log(questionSet);

function fetchQuestions(q_csv, book=EXODUS){
    fetch(q_csv)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text(); // Read the file as text
        })
        .then(csvText => {
            // Use PapaParse to parse the CSV text
            Papa.parse(csvText, {
                header: true, // Use the first row as header
                complete: function(results, file) {
                    console.log("Parsing complete:", results, file);
                    // put each question into the correct inner array
                    let questions = results.data;
                    for (let i = 0; i < questions.length; i++){
                        let chapter = parseInt(questions[i][CH]);
                        if (!chapter) chapter = MAX_CHAPTER_1;  // if no chapter is listed, add it to the last chapter in the book
                        questionSet[EXODUS][chapter - 1].push(questions[i])     // add question to array for chapter in book
                    }
                },
                error: function(err) {
                    console.error('Error parsing CSV:', err);
                }
            });
        })
        .catch(error => {
            console.error('Error fetching the CSV file:', error);
        });
}
fetchQuestions(EXODUS_CSV, EXODUS);


// USER INTERACTION

// User picking question bank

let questionBank = [];  // the set of questions that are actually going to be shown

let started = false;    // has the user hit the start button

let currQuestion = 0;

class Sequence {
    constructor(){
        this.length;
        this.curr = 0;
        this.shuffled = [];     // shuffled version of the sequence
        this.isShuffled = false;
    }
    setLength(n){
        this.length = n;
    }
    setCurr(num){
        this.curr = num;
    }
    shuffle(){
        this.bank = [];
        this.shuffled = [];
        this.curr = 0;
        // [0, 1, 2, ...]
        for (let i = 0; i < this.length; i++){
            this.bank.push(i);
        }
        // get random number from bank without replacement until there's nothing left
        while (this.bank.length > 0){
            let aRand = Math.floor(Math.random()*this.bank.length);
            this.shuffled.push(this.bank[aRand]);
            this.bank.splice(aRand, 1); // remove aRand from bank
        }
        this.isShuffled = true;
    }
    unshuffle(){
        this.curr = 0;
        this.shuffled = [];
        this.isShuffled = false;
    }
    // getter for this.curr that factors in shuffling
    i(){
        if (this.isShuffled) return this.shuffled[this.curr];
        return this.curr;
    }
}

Seq = new Sequence();


// Note card span elements
const question = document.getElementById('q_text');
const answer = document.getElementById('a_text');
const infoText = document.getElementById('infoText')

function start(){
    started = true;

    let isExodus = document.getElementById('book1').checked;
    let exodusMin = parseInt(document.getElementById('book1min').value);
    let exodusMax = parseInt(document.getElementById('book1max').value);
    console.log(isExodus, exodusMin, exodusMax)

    // Add question set questions to question bank
    for (let i = exodusMin - 1; i <= exodusMax - 1; i++){
        questionBank = questionBank.concat(questionSet[EXODUS][i])
    }

    Seq.setLength(questionBank.length);
    Seq.setCurr(0);
    question.textContent = questionBank[Seq.i()][Q];
    answer.textContent = "";
    
    infoText.textContent = "Question 1 of " + questionBank.length;
}

// User controls

class Controls {
    constructor(parameters) {
        this.question = document.getElementById('q_text');
        this.answer = document.getElementById('a_text');
        this.infoText = document.getElementById('infoText');
        this.shuffleButton = document.getElementById('shuffle_button')
    }

    left(){
        if (!started) return;

        if (Seq.curr > 0) Seq.curr--;
        this.question.textContent = questionBank[Seq.i()][Q];
        this.answer.textContent = "";

        this.infoText.textContent = `Question ${Seq.curr + 1} of ${Seq.length}`
    }
    right(){
        if (!started) return;

        if (Seq.curr < questionBank.length - 1) Seq.curr++;
        this.question.textContent = questionBank[Seq.i()][Q];
        this.answer.textContent = "";

        this.infoText.textContent = `Question ${Seq.curr + 1} of ${Seq.length}`
    }
    space(){
        if (!started) return;

        answer.textContent = capitalizeFirstLetter(questionBank[Seq.i()][A]);
    }
    shuffle(){
        if (!started) return;

        if (this.shuffleButton.textContent.toLowerCase() == "shuffle"){
            Seq.shuffle();
            this.shuffleButton.textContent = "Unshuffle";
            // this.shuffleButton.style.backgroundColor = "#7d2505";
            this.shuffleButton.classList.toggle("clicked");

            this.question.textContent = questionBank[Seq.i()][Q];
            this.answer.textContent = "";

            this.infoText.textContent = `Question ${Seq.curr + 1} of ${Seq.length}`
        }
        else if (this.shuffleButton.textContent.toLowerCase() == "unshuffle"){
            Seq.unshuffle();
            this.shuffleButton.textContent = "Shuffle";
            // this.shuffleButton.style.backgroundColor = "#972D07";
            this.shuffleButton.classList.toggle("clicked");

            this.question.textContent = questionBank[Seq.i()][Q];
            this.answer.textContent = "";

            this.infoText.textContent = `Question ${Seq.curr + 1} of ${Seq.length}`
        }
        else {
            console.log("Shuffling error")
        }
    }

}

const Ctrl = new Controls();


// Listen for keydown event
document.addEventListener('keydown', function(event) {
    // Check if the pressed key is the spacebar (keyCode 32 or event.code === 'Space')
    if (event.code === 'Space') {
        Ctrl.space();
    }
    if (event.code == "ArrowLeft"){
        Ctrl.left();
    }
    if (event.code == "ArrowRight"){
        Ctrl.right();
    }
    if (event.code == "KeyH"){
        Ctrl.shuffle();
        console.log("H");
    }
});

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
