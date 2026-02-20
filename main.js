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
const SECOND_SAMUEL = 0;
const ACTS = 1;
const ISAIAH = 2;
const TITUS = 3;
const MAX_CHAPTER = [24,28,66,3];
// const MAX_CHAPTER = [24, 28, 66, 3];

const SECOND_SAMUEL_CSV = 'data/secondSamuel.csv';
const ACTS_CSV = 'data/acts.csv';
const ISAIAH_CSV = 'data/isaiah.csv';
const TITUS_CSV = 'data/titus.csv';

// PRE-PROCESSING

let questionSet = [[],[],[],[]];
questionSet[SECOND_SAMUEL] = Array(MAX_CHAPTER[0]).fill().map(() => []);     // array of empty arrays with one for each chapter
questionSet[ACTS] = Array(MAX_CHAPTER[1]).fill().map(() => []);
questionSet[ISAIAH] = Array(MAX_CHAPTER[2]).fill().map(() => []);
questionSet[TITUS] = Array(MAX_CHAPTER[3]).fill().map(() => []);
console.log(questionSet);

function fetchQuestions(q_csv, book){
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
                        if (!chapter) chapter = MAX_CHAPTERS[book];  // if no chapter is listed, add it to the last chapter in the book
                        questionSet[book][chapter - 1].push(questions[i])     // add question to array for chapter in book
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
fetchQuestions(SECOND_SAMUEL_CSV, SECOND_SAMUEL);
fetchQuestions(ACTS_CSV, ACTS);
fetchQuestions(ISAIAH_CSV, ISAIAH);
fetchQuestions(TITUS_CSV, TITUS);


// USER INTERACTION

// Mobile Functionality for the drop settings



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
    // randomLimit(limit = 100){
    //     this.shuffle();

    // }
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
    
    // called by "start" buttons
    start(){
        this.started = true;
        questionBank = [];
    
        // Get user info
        let isBook1 = document.getElementById('book1').checked;
        let book1Min = parseInt(document.getElementById('book1min').value);
        let book1Max = parseInt(document.getElementById('book1max').value);

        let isBook2 = document.getElementById('book2').checked;
        let book2Min = parseInt(document.getElementById('book2min').value);
        let book2Max = parseInt(document.getElementById('book2max').value);

        let isBook3 = document.getElementById('book3').checked;
        let book3Min = parseInt(document.getElementById('book3min').value);
        let book3Max = parseInt(document.getElementById('book3max').value);
        
        let isBook4 = document.getElementById('book4').checked;
        let book4Min = parseInt(document.getElementById('book4min').value);
        let book4Max = parseInt(document.getElementById('book4max').value);

        let isLimited = document.getElementById('qLimit').checked;
        let qLimit = document.getElementById('qLimitNum').value;

        
        if (isBook1){
            // Move specified questions from question set to question bank
            for (let i = book1Min - 1; i <= book1Max - 1; i++){
                questionBank = questionBank.concat(questionSet[SECOND_SAMUEL][i]);
            }
        }
        if (isBook2){
            for (let i = book2Min - 1; i <= book2Max - 1; i++){
                questionBank = questionBank.concat(questionSet[ACTS][i]);
            }
        }
        if (isBook3){
            for (let i = book3Min - 1; i <= book3Max - 1; i++){
                questionBank = questionBank.concat(questionSet[ISAIAH][i]);
            }
        }
        if (isBook4){
            for (let i = book4Min - 1; i <= book4Max - 1; i++){
                questionBank = questionBank.concat(questionSet[TITUS][i]);
            }
        }
        if (isLimited){
            if (qLimit < questionBank.length){
                questionBank = randomSubset(questionBank, qLimit);
            }
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

    mobileStart(){
        this.useMobileSettings();
        this.hideMobileSettings();
        this.start();
    }

    showMobileSettings(){
        let mobileSettings = document.getElementById("settings");
        mobileSettings.classList.remove("settings_hide")
        mobileSettings.classList.add("settings_show")
        
    }
    
    hideMobileSettings(){
        let mobileSettings = document.getElementById("settings");
        mobileSettings.classList.remove("settings_show")
        mobileSettings.classList.add("settings_hide")
        
    }

    // showExtraBooks(){

    // }

    // lazy workaround, change the invisible normal user input values to the mobile values, then start like normal
    useMobileSettings(){
        
        document.getElementById('book1').checked = document.getElementById('mobileBook1').checked;
        document.getElementById('book2').checked = document.getElementById('mobileBook2').checked;
        document.getElementById('book3').checked = document.getElementById('mobileBook3').checked;
        document.getElementById('book4').checked = document.getElementById('mobileBook4').checked;

        document.getElementById('book1min').value = document.getElementById('mobileBook1min').value;
        document.getElementById('book1max').value = document.getElementById('mobileBook1max').value;
        document.getElementById('book2min').value = document.getElementById('mobileBook2min').value;
        document.getElementById('book2max').value = document.getElementById('mobileBook2max').value;
        document.getElementById('book3min').value = document.getElementById('mobileBook3min').value;
        document.getElementById('book3max').value = document.getElementById('mobileBook3max').value;
        document.getElementById('book4min').value = document.getElementById('mobileBook4min').value;
        document.getElementById('book4max').value = document.getElementById('mobileBook4max').value;

        document.getElementById('qLimit').checked = document.getElementById('mobileQLimit').checked;
        document.getElementById('qLimitNum').value = document.getElementById('mobileQLimitNum').value;

        this.start();
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

function randomSubset(arr, n){
    if (n >= arr.length) return arr.slice;
    ans = arr.slice();
    // Fisher-Yates to randomize until you have n
    let i;
    let m = arr.length; // last unshuffled element
    while (m > ans.length - n){
        // pick rand and swap with last in unrandomized     [1, 3, 4, 7, | 5, 6, 2]
        i = randInt(m);
        let swap = ans[i];
        ans[i] = ans[m - 1];
        ans[m - 1] = swap;
        m--;
    }
    // n number of elements from the back
    ans = ans.slice(-1 * n)
    return ans;
}

function randInt(n){
    return Math.floor(Math.random() * n);
}