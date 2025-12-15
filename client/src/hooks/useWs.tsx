import { useState, useEffect } from 'react'
import useWebSocket from 'react-use-websocket'
import { WS_PREFIX } from '../consts'
import Cookies from 'js-cookie'
import { type Room } from '../@types/room'
import { type NoteMessage, type NoteIDMessage } from '../@types/note'
import { type Message } from '../@types/message'
import CryptoJS from 'crypto-js'

const WSActions = {
  HandshakeAction: 'handshake',
  JoinRoomAction: 'join-room',
  SendNoteAction: 'send-note',
  EditNoteAction: 'edit-note',
  DeleteNoteAction: 'delete-note',
  EditRoomAction: 'edit-room',
  DeleteRoomAction: 'delete-room',
  ConnectAction: 'connect',
  DisconnectAction: 'disconnect'
}

interface UseWSResponse {
  lastReceivedNote: NoteMessage | undefined
  lastEditedNote: NoteMessage | undefined
  lastDeletedNote: NoteIDMessage | undefined
  lastEditedRoom: Room | undefined
  lastDeletedRoom: Room | undefined
  lastUserConnected: number | undefined
  joinRoom: (room: Room) => void
  editRoom: (room: Room) => void
  deleteRoomWS: (room: Room) => void
  sendNote: (note: NoteMessage) => void
  editNote: (note: NoteMessage) => void
  deleteNote: (note: NoteIDMessage) => void
  resetStates: () => void
}

export function useWS (): UseWSResponse {
  const [lastReceivedNote, setLastReceivedNote] = useState<NoteMessage>()
  const [lastEditedNote, setLastEditedNote] = useState<NoteMessage>()
  const [lastDeletedNote, setLastDeletedNote] = useState<NoteIDMessage>()
  const [lastEditedRoom, setLastEditedRoom] = useState<Room>()
  const [lastDeletedRoom, setLastDeletedRoom] = useState<Room>()
  const [lastUserConnected, setLastUserConnected] = useState<number>()

  const { sendMessage, lastMessage } = useWebSocket(WS_PREFIX, {
    share: true,
    shouldReconnect: () => false,
    onOpen: () => {
      console.log('connected to WS')

      const initMessage: Message = {
        action: 'init-client',
        message: {
          access_token: Cookies.get('access_token'),
          userId: Number(Cookies.get('user_id'))
        }
      }

      sendMessage(encryptMessage(initMessage))
    },
    onClose: () => {
      console.log('Disconnected from WS')
    }
  })
  // every time a note is sent, append it to receivedNotes array
  useEffect((): void => {
    if (lastMessage !== null) {
      const encryptedMessage = lastMessage.data

      const message = decryptMessage(encryptedMessage)
      if (message.action === WSActions.SendNoteAction) {
        setLastReceivedNote(message.message)
      } else if (message.action === WSActions.EditNoteAction) {
        setLastEditedNote(message.message)
      } else if (message.action === WSActions.DeleteNoteAction) {
        setLastDeletedNote(message.message)
      } else if (message.action === WSActions.EditRoomAction) {
        setLastEditedRoom(message.message)
      } else if (message.action === WSActions.DeleteRoomAction) {
        setLastDeletedRoom(message.message)
      } else if (message.action === WSActions.ConnectAction) {
        setLastUserConnected(message.message.user_id)
      }
    }
  }, [lastMessage?.data])

  // custom functions to handle message actions
  function joinRoom (room: Room): void {
    const roomName = `r_${room.id}_${room.name}`
    const message: Message = {
      action: WSActions.JoinRoomAction,
      message: {
        id: room.id,
        name: roomName
      }
    }
    sendMessage(encryptMessage(message))
  }

  function editRoom (room: Room): void {
    const message = {
      action: WSActions.EditRoomAction,
      message: room
    }
    sendMessage(encryptMessage(message))
  }

  function deleteRoomWS (room: Room): void {
    const message = {
      action: WSActions.DeleteRoomAction,
      message: room
    }
    sendMessage(encryptMessage(message))
  }

  function sendNote (note: NoteMessage): void {
    const message: Message = {
      action: WSActions.SendNoteAction,
      message: note
    }
    console.log(message)
    sendMessage(encryptMessage(message))
  }

  function editNote (note: NoteMessage): void {
    const message: Message = {
      action: WSActions.EditNoteAction,
      message: note
    }
    sendMessage(encryptMessage(message))
  }

  function deleteNote (note: NoteIDMessage): void {
    const message = {
      action: WSActions.DeleteNoteAction,
      message: note
    }
    sendMessage(encryptMessage(message))
  }

  function resetStates (): void {
    setLastReceivedNote(undefined)
    setLastEditedNote(undefined)
    setLastDeletedNote(undefined)
    setLastEditedRoom(undefined)
    setLastDeletedRoom(undefined)
  }

  function encryptMessage (message: Message): string {
    const key = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_ENCRYPTION_KEY)
    const nonce = CryptoJS.enc.Utf8.parse('1234567812345678')
    const encryptedMessage = CryptoJS.AES.encrypt(
      JSON.stringify(message),
      key,
      {
        iv: nonce,
        padding: CryptoJS.pad.Pkcs7
      }
    )
    return encryptedMessage.toString()
  }

  function decryptMessage (encryptedMessage: string): Message {
    const key = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_ENCRYPTION_KEY)
    const nonce = CryptoJS.enc.Utf8.parse('1234567812345678')
    const decryptedMessage = CryptoJS.AES.decrypt(
      encryptedMessage.toString(),
      key,
      {
        iv: nonce,
        padding: CryptoJS.pad.Pkcs7
      }
    )

    return JSON.parse(decryptedMessage.toString(CryptoJS.enc.Utf8)) as Message
  }

  return {
    lastReceivedNote,
    lastEditedNote,
    lastDeletedNote,
    lastEditedRoom,
    lastDeletedRoom,
    lastUserConnected,
    joinRoom,
    editRoom,
    deleteRoomWS,
    sendNote,
    editNote,
    deleteNote,
    resetStates
  }
}
