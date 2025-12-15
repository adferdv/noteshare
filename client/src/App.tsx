import { Navigate } from 'react-router-dom'
import './App.css'
import { UserContext } from './contexts/userDataContext'
import { useContext, useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { RoomView } from './components/Room'
import Cookies from 'js-cookie'
import { useWS } from './hooks/useWs'
import { type Room } from './@types/room'

const App: React.FC = () => {
  const userDataContext = useContext(UserContext)
  const [currentRoom, setCurrentRoom] = useState<Room | undefined>()
  const {
    lastReceivedNote,
    lastEditedNote,
    lastDeletedNote,
    lastEditedRoom,
    lastDeletedRoom,
    sendNote,
    editNote,
    deleteNote,
    joinRoom,
    editRoom,
    deleteRoomWS,
    resetStates
  } = useWS()

  useEffect(() => {
    if (Cookies.get('authenticated') === undefined) {
      Cookies.set('authenticated', 'true')
    }
  }, [])
  return (
    <>
      {userDataContext?.userData.accessToken !== undefined &&
      Cookies.get('authenticated') === 'true'
        ? (
        <main className="flex h-full">
          <Sidebar
            joinRoom={joinRoom}
            resetVariables={resetStates}
            lastReceivedNote={lastReceivedNote}
            lastEditedNote={lastEditedNote}
            lastEditedRoom={lastEditedRoom}
            lastDeletedRoom={lastDeletedRoom}
            currentRoom={currentRoom}
            currentRoomSetter={setCurrentRoom}
          />
          {currentRoom !== undefined && (
            <RoomView
              lastReceivedNote={lastReceivedNote}
              lastEditedNote={lastEditedNote}
              lastDeletedNote={lastDeletedNote}
              lastEditedRoom={lastEditedRoom}
              lastDeletedRoom={lastDeletedRoom}
              sendNote={sendNote}
              editNote={editNote}
              deleteNote={deleteNote}
              editRoom={editRoom}
              deleteRoomWS={deleteRoomWS}
              currentRoom={currentRoom}
              setCurrentRoom={setCurrentRoom}
            />
          )}
        </main>
          )
        : (
        <Navigate to="/login" replace={true} />
          )}
    </>
  )
}

export default App
