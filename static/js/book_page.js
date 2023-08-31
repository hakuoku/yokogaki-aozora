const otehon = {
    'lastVisitedPage': {'setting':{'colorScheme': 'white'}, 'createdDate': 'date', 'lastVisitedDate': 'date'}, 
    '001393': {
        'authorName': '',
        '57320':{'setting' :{'colorScheme': 'white'}, 'bookTitle': '', 'createdDate': 'date', 'lastVisitedDate': 'date'}, 
        '55880': {'setting' :{'colorScheme': 'gray'}, 'bookTitle': '', 'createdDate': 'date', 'lastVisitedDate': 'date'}
    }
}

function initSetting() {
    const defaultSetting = {'fontFamily': 'sans-serif', 'fontWeight': '', 'colorScheme': 'white', 'fontSize': 'medium', 'margin': 'medium', 'lineHeight': 1.5}
    const storageSetting = JSON.parse(localStorage.getItem('yokogakiAozoraSetting'))
    if (storageSetting) {
        const lastVisitedSetting = storageSetting.lastVisitedPage.setting
        Object.keys(defaultSetting).forEach(key => {
            if (key in lastVisitedSetting === false) {
                lastVisitedSetting[key] = defaultSetting[key]
            }
        })
        Object.keys(lastVisitedSetting).forEach(key => {
            if (key in defaultSetting === false) {
                delete lastVisitedSetting[key]
            }
        })
        storageSetting.lastVisitedPage.setting = lastVisitedSetting
        localStorage.setItem('yokogakiAozoraSetting', JSON.stringify(storageSetting))
    } else {
        const initialStorage = {}
        initialStorage.lastVisitedPage = {}
        initialStorage.lastVisitedPage.setting = defaultSetting
        localStorage.setItem('yokogakiAozoraSetting', JSON.stringify(initialStorage))
    }
    const newSetting = JSON.parse(localStorage.getItem('yokogakiAozoraSetting'))
    const authorID = findIDs().authorID, bookID = findIDs().bookID
    if (authorID in newSetting) {
        const authorObject = newSetting[authorID]
        if (bookID in authorObject) {
            Object.keys(defaultSetting).forEach(key => {
                if (key in authorObject[bookID].setting === false) {
                    authorObject[bookID].setting[key] = defaultSetting[key]
                }
            })
            Object.keys(authorObject[bookID].setting).forEach(key => {
                if (key in defaultSetting === false) {
                    delete authorObject[bookID].setting[key]
                }
            })
            newSetting.lastVisitedPage = authorObject[bookID]
        } else {
            newSetting[authorID][bookID] = newSetting.lastVisitedPage
        }
    } else {
        newSetting[authorID] = {}
        newSetting[authorID][bookID] = newSetting.lastVisitedPage
    }
    newSetting[authorID].authorName = findIDs().authorName
    newSetting[authorID][bookID].bookTitle = findIDs().bookTitle
    newSetting[authorID][bookID].lastVisitedDate = Date.now()
    localStorage.setItem('yokogakiAozoraSetting', JSON.stringify(newSetting))
    Object.keys(newSetting.lastVisitedPage.setting).forEach(key => {
        applySetting(key, newSetting.lastVisitedPage.setting[key])
        const elements = document.getElementsByName(key)
        if (key === 'fontWeight') {
            
        } else if (key === 'colorScheme') {
            elements.forEach(choice => {
                if (newSetting.lastVisitedPage.setting[key] === choice.value) {
                    choice.checked = true;
                }
            })
        } else {
            elements[0].value = newSetting.lastVisitedPage.setting[key]
        }
    })
}

function refreshSetting(event) {
    const changed = event.target
    applySetting(changed.name, changed.value)
    // ここでfontWeightは渡らないので下のifで反映
    const storageSetting = JSON.parse(localStorage.getItem('yokogakiAozoraSetting'))
    const lastVisitedSetting = storageSetting.lastVisitedPage.setting
    lastVisitedSetting[changed.name] = changed.value
    if (changed.name === 'fontFamily') {
        lastVisitedSetting.fontWeight = changed.options[changed.selectedIndex].dataset.weight || ''
        document.body.style.setProperty("--main-fontWeight", lastVisitedSetting.fontWeight);
    }
    storageSetting.lastVisitedPage.setting = lastVisitedSetting
    const authorID = findIDs().authorID, bookID = findIDs().bookID
    storageSetting[authorID][bookID].setting = lastVisitedSetting
    localStorage.setItem('yokogakiAozoraSetting', JSON.stringify(storageSetting))
}

function applySetting(target, value) {
    const body = document.body
    const main = document.getElementsByClassName('main')[0]
    if (target === 'bookTitle') {
        
    } else if (target === 'fontFamily' || target === 'fontWeight' || target === 'fontSize' || target === 'lineHeight') {
        body.style.setProperty("--main-" + target, value)
    } else if (target === 'colorScheme') {
        body.classList.remove(...body.classList)
        body.classList.add('body', value)
    } else if (target === 'margin') {
        let marginValue = ''
        if (window.matchMedia( '(max-width: 600px)' ).matches) {
            if (value === 'extraBroad') {
                marginValue = '20vw'
            } else if (value === 'broad') {
                marginValue = '12vw'
            } else if (value === 'medium') {
                marginValue = '8vw'
            } else if (value === 'narrow') {
                marginValue = '4vw'
            } else if (value === 'extraNarrow') {
                marginValue = '2vw'
            }
        } else {
            if (value === 'extraBroad') {
                marginValue = '24vw'
            } else if (value === 'broad') {
                marginValue = '18vw'
            } else if (value === 'medium') {
                marginValue = '10vw'
            } else if (value === 'narrow') {
                marginValue = '4vw'
            } else if (value === 'extraNarrow') {
                marginValue = '2vw'
            }
        }
        body.style.setProperty("--main-margin", marginValue)
    }
}

function findIDs() {
    const URLmatched = location.pathname.match(/^\/(\d{6})\/(\d+)$/)
    const authorName = document.getElementsByClassName('author')[0].textContent
    const bookTitle = document.getElementsByClassName('title')[0].textContent
    return {'authorID': URLmatched[1].toString(), 'bookID': URLmatched[2].toString(), 'authorName': authorName, 'bookTitle': bookTitle}
}

window.addEventListener('load', function() {
    initSetting()
    document.getElementsByClassName('settings')[0].addEventListener('input', refreshSetting)
    const contents = document.getElementById('contents')
    contents.style.display = 'block'
    // <div class="contents_visible"><a href="https://www.aozora.gr.jp/cards/000148/card799.html" target="_blank">青空文庫　図書カードへ</a></div>
    const bookCardLink = '<div class="contents_visible"><a href="https://www.aozora.gr.jp/cards/' + findIDs().authorID + '/card' + findIDs().bookID + '.html">青空文庫　図書カードへ</a></div>'
    contents.insertAdjacentHTML('beforeend', bookCardLink)
    contents.insertAdjacentHTML('beforeend', '<div class="contents_visible"><a href="/">サイトトップへ</a></div>')
    const httpLinks = document.querySelectorAll('a[href^=http]')
    const domainRegex = new RegExp(document.domain)
    httpLinks.forEach(link => {
        const href = link.getAttribute('href')
        if (!domainRegex.test(href)) {
            link.setAttribute('target', '_blank')
            link.setAttribute('rel', 'noopener noreferrer')
        }
    })
});