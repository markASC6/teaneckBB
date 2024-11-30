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
let questionStock = []; // copy of question bank that will remain unchanged for question drops

class Sequence {
    constructor(){
        this.length;
        this.curr = 0;
        this.seq = [];          // in order sequence
        this.shuffled = [];     // shuffled version of the sequence
        this.isShuffled = false;
        this.isFinished = false;
    }
    setLength(n){
        this.length = n;
        this.seq = [];
        // Create Sequence of length n
        for (let i = 0; i < this.length; i++){
            this.seq.push(i);
        }
    }
    setCurr(num){
        this.curr = num;
    }
    left(){
        // if the first card
        if (this.curr <= 0) return false;
        this.curr--;
        return true;
    }
    right(){
        // if not the last card
        if (this.curr < this.length - 1){
            this.curr++;
            return true;
        }
        else {
            Seq.isFinished = true;
            return false;
        }
    }
    shuffle(){
        this.shuffled = [];
        this.curr = 0;
        // [0, 1, 2, ...]
        let bank = this.seq.slice();
        // get random number from bank without replacement until there's nothing left
        while (bank.length > 0){
            let aRand = Math.floor(Math.random()*bank.length);
            this.shuffled.push(bank[aRand]);
            bank.splice(aRand, 1); // remove aRand from bank
        }
        this.isShuffled = true;
    }
    unshuffle(){
        this.curr = 0;
        this.shuffled = [];
        this.isShuffled = false;
        this.isFinished = false;
    }
    // getter for this.curr that factors in shuffling
    i(){
        if (this.isShuffled) return this.shuffled[this.curr];
        return this.seq[this.curr];
    }
    dropCurr(){
        // if dropping the last question
        if (this.length <= 1){
            this.isFinished = true;
            return;
        }
        this.length--;
        if (this.isShuffled){
            // remove from unshuffled version
            let shuffledVal = this.shuffled[this.curr];
            let seqIndex = this.seq.indexOf(shuffledVal);
            if (seqIndex != -1) this.seq.splice(seqIndex, 1);
            // remove from shuffled
            this.shuffled.splice(this.curr, 1);
        }
        else {
            this.seq.splice(this.curr, 1);
        }
        // if you dropped the last card
        if (this.curr == this.length) this.curr--;
    }
}

Seq = new Sequence();


// User controls

class Controls {
    constructor(parameters) {
        this.question = document.getElementById('q_text');
        this.answer = document.getElementById('a_text');
        this.infoText = document.getElementById('infoText');
        this.shuffleButton = document.getElementById('shuffle_button');
        this.blank = document.getElementById('blank');
        this.finishText = document.getElementById('finishText');
        
        this.started = false;
        this.isFinished = false;
        this.dropCount = 0;
    }
    
    
    start(){
        this.started = true;
        questionBank = [];
    
        // Get user info
        let isExodus = document.getElementById('book1').checked;
        let exodusMin = parseInt(document.getElementById('book1min').value);
        let exodusMax = parseInt(document.getElementById('book1max').value);
        console.log(isExodus, exodusMin, exodusMax)
    
        // Move specified questions from question set to question bank
        for (let i = exodusMin - 1; i <= exodusMax - 1; i++){
            questionBank = questionBank.concat(questionSet[EXODUS][i]);
        }
        questionStock = questionBank.slice();    // shallow copy
    
        this.isFinished = false;
        let isHidden = notecard.classList[0] == "hide";     // to-do: make this a class var
        if (isHidden) notecard.classList.toggle("hide");    // take away .hide
        
        this.shuffleButton.textContent = "Shuffle";
        if (this.shuffleButton.classList[0] == "clicked"){
            this.shuffleButton.classList.toggle("clicked");
        }
        
        Seq.unshuffle();     // resets Seq
        Seq.setLength(questionBank.length);
        this.dropCount = 0;

        this.showQ();
    }
    
    left(){
        if (!this.started || this.isFinished) return;

        // if there is a change, show it
        if (Seq.left()) this.showQ();
    }
    right(){
        if (!this.started || this.isFinished) return;

        if (Seq.right()){
            this.showQ();
            return;
        }
        if (Seq.isFinished){
            if (!this.isFinished) this.finished();
            return;
        }

        // if (Seq.curr >= questionBank.length - 1){
        //     if (!this.isFinished) this.finished();
        //     return;
        // }
        // if (Seq.curr < questionBank.length - 1) Seq.curr++;
        // this.showQ()
    }
    showQ(){
        this.question.textContent = capitalizeFirstLetter(questionBank[Seq.i()][Q]);
        this.answer.textContent = "";

        this.infoText.textContent = `Question ${Seq.curr + 1} of ${Seq.length}`

    }
    space(){
        if (!this.started) return;

        this.answer.textContent = capitalizeFirstLetter(questionBank[Seq.i()][A]);
    }
    shuffle(){
        if (!this.started) return;

        if (this.shuffleButton.textContent.toLowerCase() == "shuffle"){
            Seq.shuffle();
            this.shuffleButton.textContent = "Unshuffle";
            // this.shuffleButton.style.backgroundColor = "#7d2505";
            this.shuffleButton.classList.toggle("clicked");

            this.question.textContent = capitalizeFirstLetter(questionBank[Seq.i()][Q]);
            this.answer.textContent = "";

            this.infoText.textContent = `Question ${Seq.curr + 1} of ${Seq.length}`
        }
        else if (this.shuffleButton.textContent.toLowerCase() == "unshuffle"){
            Seq.unshuffle();
            this.shuffleButton.textContent = "Shuffle";
            this.shuffleButton.classList.toggle("clicked");

            this.question.textContent = capitalizeFirstLetter(questionBank[Seq.i()][Q]);
            this.answer.textContent = "";

            this.infoText.textContent = `Question ${Seq.curr + 1} of ${Seq.length}`
        }
        else {
            console.log("Shuffling error")
        }
    }
    drop(){
        if (!this.started) return;

        Seq.dropCurr();
        if (Seq.isFinished){
            if (this.isFinished) this.finished();
            return;
        }
        if (questionBank.length == 1){
            if (!this.isFinished) this.finished();
            return;
        }
        this.dropCount++;

        // update info text
        this.infoText.textContent = `Question ${Seq.curr + 1} of ${Seq.length}`


        // fade animation
        this.blank.classList.remove("hide");
        this.blank.classList.add("fade_in_out")
        // fade out .5 seconds
        setTimeout(() => {
            this.question.textContent = capitalizeFirstLetter(questionBank[Seq.i()][Q]);
            this.answer.textContent = "";
        }, 250)
        setTimeout(() => {
            this.blank.classList.add("hide")
            this.blank.classList.remove("fade_in_out")
        }, 500)
        // fade in .5 seconds

    }
    finished(){
        this.isFinished = true;
        let isHidden = (notecard.classList[0] == "hide");
        if (!isHidden) notecard.classList.toggle("hide");

        this.finishText.innerHTML = `
            You've completed this question set!
            <br>Questions reviewed: ${questionStock.length}
            <br>Questions dropped: ${this.dropCount}
            <br> Would you like to
            <br>&emsp; Review the undropped questions?
            <br>&emsp; Review all the questions?
            <br>&emsp; Change the chapters at the top?
        `;
    }
    reUndropped(){
        if (!this.started || !this.isFinished) return;
        this.isFinished = false;
        let isHidden = notecard.classList[0] == "hide";
        if (isHidden) notecard.classList.toggle("hide");    // take away .hide

        Seq.unshuffle();
        this.shuffleButton.textContent = "Shuffle";
        if (this.shuffleButton.classList[0] == "clicked"){
            this.shuffleButton.classList.toggle("clicked");
        }
        this.showQ();
    }
    reAll(){
        if (!this.started || !this.isFinished) return;
        this.isFinished = false;
        let isHidden = notecard.classList[0] == "hide";
        if (isHidden) notecard.classList.toggle("hide");    // take away .hide

        questionBank = questionStock.slice();   // copy of questionStock
        Seq.unshuffle();
        this.shuffleButton.textContent = "Shuffle";
        if (this.shuffleButton.classList[0] == "clicked"){
            this.shuffleButton.classList.toggle("clicked");
        }
        Seq.setLength(questionBank.length);
        this.dropCount = 0;
        this.showQ();
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
    }
    if (event.code == "KeyD"){
        Ctrl.drop();
    }
});

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
