const socket = io()

const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = document.querySelector('#inputMessage')
const $messageFormButton = document.querySelector('#submitButton')
const sendLocationButton = document.querySelector('#sendLocation')
const messagesDiv = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix:true})

const autoscroll = () => {
    // New message element
    const newMessage = messagesDiv.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messagesDiv.offsetHeight

    // Height of messages container
    const containerHeight = messagesDiv.scrollHeight

    // How far have i scrolled
    const scrollOffset = messagesDiv.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight
    }
    // console.log(newMessageMargin)
}

socket.on('message', (message) => {
    // console.log(message.text)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messagesDiv.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (mapsUrl) => {
    // console.log(mapsUrl)
    const html = Mustache.render(locationMessageTemplate, {
        username: mapsUrl.username,
        mapsUrl: mapsUrl.mapsUrl,
        createdAt:  moment(mapsUrl.createdAt).format('h:mm a')
    })
    messagesDiv.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = event.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered')
    })
})

sendLocationButton.addEventListener('click', () => {
    sendLocationButton.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', location, (acknowledge) => {
            sendLocationButton.removeAttribute('disabled')
            console.log(acknowledge)
        })
    })
})

socket.emit('join', {username,room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})