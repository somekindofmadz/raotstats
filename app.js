var isOpened = false;
var page = 1;
var forms = 0;
var perPage = 4;
var noRes = false;

window.onload = () => {
const bg = ['city', 'crystal', 'forest', 'underground', 'utgard'];
const click = new Audio('mp3/click.wav');
const close = new Audio('mp3/close.wav');
const inputClick = new Audio('mp3/input.wav');
  
const socket = io.connect();
    socket.on('connected', (data) => {

        window.document.body.style.backgroundImage = `url('img/${sample(bg)}.png')`;

        buildStats(data);

        var input = window.document.getElementById('filter');
        input.addEventListener('input', (e) => {
            var value = e.target.value;
            if(noRes){
                input.style.color = '#e2e2e2';
            }
            setTimeout( () => {
            if(value !== e.target.value) return;
            if(e.target.value){
                socket.emit('queryFilter', e.target.value);
            } else {
                socket.emit('refreshFilter');
            }
        }, 1000);
        input.addEventListener('click', () => {
            inputClick.play();
        });
    });
    var nbtn = window.document.getElementById('nbtn');
    nbtn.textContent = '>';
    nbtn.addEventListener('click', () => {
        forms+= perPage;
        var toSkip = forms;
        var input = window.document.getElementById('filter');
        if(input.value !== ''){
            socket.emit('getPage', {toSkip: toSkip, query: input.value});
        } else {
            socket.emit('getPage', {toSkip: toSkip});
        }
        page++;
        click.play();
    });
    var pbtn = window.document.getElementById('pbtn');
    pbtn.textContent = '<';
    pbtn.addEventListener('click', () => {
        if(page === 1) return;
        forms-= perPage;
        var toSkip = forms;
        var input = window.document.getElementById('filter');
        if(input.value !== ''){
            socket.emit('getPage', {toSkip: toSkip, query: input.value});
        } else {
            socket.emit('getPage', {toSkip: toSkip});
        }
        page--;
        close.play();
    });
    var jbtn = window.document.getElementById('jbtn');
    jbtn.addEventListener('click', () => {
        window.open('https://discord.gg/3CadpBPmhp');
        click.play();
    });
    var abtn = window.document.getElementById('abtn');
    abtn.addEventListener('click', () => {
        if(!isOpened){
            openAbout();
            click.play();
        } else {
            closeAbout();
            close.play();
        }
    });
    });
    socket.on('finishQuery', (data) => {
        if(data.length < 1){
            window.document.getElementById('filter').style.color='#a53434';
            noRes = true;
        } else {
            clearStats();
            buildStats(data);
            page = 1;
            forms = 0;
            window.document.getElementById('page').textContent = page;
        }
    });
    socket.on('finishRefresh', (data) => {
        clearStats();
        buildStats(data);
        page = 1;
        forms = 0;
        window.document.getElementById('page').textContent = page;
    });
    socket.on('receiveNewPage', (data) => {
        if(data.length < 1){
            page--;
            forms-= perPage;
            console.log(forms);
            return;
        }
        clearStats();
        buildStats(data);
        window.document.getElementById('page').textContent = page;
    });
};

function buildStats(data){
    const th = window.document.createElement('tr');
    const nameHead = window.document.createElement('th');
    const killHead = window.document.createElement('th');
    const deathHead = window.document.createElement('th');
    nameHead.textContent = 'Name';
    nameHead.className = 'name';
    killHead.textContent = 'Kills';
    killHead.className = 'kills';
    deathHead.textContent = 'Deaths';
    deathHead.className = 'deaths';
    const tab = window.document.getElementById('stats');
    tab.appendChild(th);
    for(let i = 0; i < data.length; i++){
        const sec = window.document.createElement('tr');
        const name = window.document.createElement('td');
        const kills = window.document.createElement('td');
        const deaths = window.document.createElement('td');
        const num = window.document.createElement('span');
        const n = window.document.createElement('span');
        
        num.textContent = `${i + 1}`;
        num.className = `number`;
        n.textContent = `${data[i].name}`;
        n.className = `namespan`;
        name.appendChild(num);
        name.appendChild(n);
        kills.textContent = data[i].kills;
        deaths.textContent = data[i].deaths;
        name.className = 'name-td';
        kills.className = 'kills-td';
        deaths.className = 'deaths-td';
        sec.appendChild(name);
        sec.appendChild(kills);
        sec.appendChild(deaths);
        th.appendChild(nameHead);
        th.appendChild(killHead);
        th.appendChild(deathHead);
        tab.appendChild(sec);
    }
}

function clearStats(){
    var tab = window.document.getElementById('stats');
    while(tab.firstChild){
        tab.removeChild(tab.firstChild);
    }
}

function openAbout(){
    const div = window.document.createElement('div');
    div.className = 'aboutModal';
    div.id = 'aboutModal';
    const title = window.document.createElement('h1');
    title.textContent = 'About RaotStats';
    title.className = 'title';
    const divider = window.document.createElement('div');
    const divider2 = window.document.createElement('div');
    const text = window.document.createElement('p');
    const text2 = window.document.createElement('p');
    const credits = window.document.createElement('span');
    const credits2 = window.document.createElement('span');
    const credits3 = window.document.createElement('span');
    text.textContent = `RaotStats is a fan project to gather and share in-game player statistics from 27/4 DM EU server. RAOTFG developers are not associated with this project at all.`;
    text2.textContent = `If you have quesions regarding your stats, contact creators on RAOT Summit discord server.`;
    credits.textContent = `Brewskii: Server scripting`;
    credits2.textContent = `Madz: Website`;
    credits3.textContent = `Neferpitou: Logo`;
    div.appendChild(title);
    div.appendChild(divider);
    div.appendChild(text);
    div.appendChild(text2);
    div.appendChild(divider2);
    div.appendChild(credits);
    div.appendChild(credits2);
    div.appendChild(credits3);
    document.getElementById('about').appendChild(div);
    isOpened = true;
}

function closeAbout(){
    var modal = window.document.getElementById('aboutModal');
    modal.parentNode.removeChild(modal);
    isOpened = false;
}

function sample(arr){
    return arr[Math.floor(Math.random() * arr.length)];
}