import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
// VwTZ4AGTxme9snANex9tep3NwvVMGfYd
import { useEventListener, useHuddle01 } from '@huddle01/react';
import { useRecorder } from '@huddle01/react/app-utils';
import { Audio, Video } from '@huddle01/react/components';
/* Uncomment to see the Xstate Inspector */
// import { Inspect } from '@huddle01/react/components';

import {
  useAudio,
  useLobby,
  useMeetingMachine,
  usePeers,
  useRoom,
  useVideo,
  useRecording
} from '@huddle01/react/hooks';

import Button from '../components/Button';

export default function Home () {
  const videoRef = useRef(null);

  const { state, send } = useMeetingMachine();
  const { startRecording, stopRecording, data, isStarting, inProgress, error } = useRecording();
  const [roomId, setRoomId] = useState('');
  // Event Listner
  useEventListener('lobby:cam-on', () => {
    if (state.context.camStream && videoRef.current)
      videoRef.current.srcObject = state.context.camStream;
  });

  const { initialize, isInitialized } = useHuddle01();
  const { joinLobby } = useLobby();
  const {
    fetchAudioStream,
    produceAudio,
    stopAudioStream,
    stopProducingAudio,
    stream: micStream,
  } = useAudio();
  const {
    fetchVideoStream,
    produceVideo,
    stopVideoStream,
    stopProducingVideo,
    stream: camStream,
  } = useVideo();
  const { joinRoom, leaveRoom } = useRoom();

  const { peers } = usePeers();

  // useRecorder(roomId, 'KL1r3E1yHfcrRbXsT4mcE-3mK60Yc3YR');
  useEffect(() => {
    if (!isInitialized) {
      initialize(process.env.NEXT_PUBLIC_PROJECT_ID)
    }
  }, [isInitialized]);

  const handleCreateRoom = async () => {
    const { roomId } = await createRoom();
    setRoomId(roomId);
  }

  return (
    <div className="grid grid-cols-2">
      <div>
        <h1 className="text-6xl font-bold">
          Welcome to{' '}
          <a className="text-blue-600" href="https://huddle01.com">
            Huddle01 SDK!
          </a>
        </h1>

        <h2 className="text-2xl">Room State</h2>
        <h3>{JSON.stringify(state.value)}</h3>

        <h2 className="text-2xl">Me Id</h2>
        <div className="break-words">
          {JSON.stringify(state.context.peerId)}
        </div>
        <h2 className="text-2xl">Consumers</h2>
        <div className="break-words">
          {JSON.stringify(state.context.consumers)}
        </div>

        <h2 className="text-2xl">Error</h2>
        <div className="break-words text-red-500">
          {JSON.stringify(state.context.error)}
        </div>
        <h2 className="text-2xl">Peers</h2>
        <div className="break-words">{JSON.stringify(peers)}</div>
        <h2 className="text-2xl">Consumers</h2>
        <div className="break-words">
          {JSON.stringify(state.context.consumers)}
        </div>

        <br />
        <br />
        <Button onClick={() => handleCreateRoom()}>Create Meet</Button>
        <br />
        <input id="roomId" type="text" placeholder='RoomId' value={roomId}
          onChange={(e) => setRoomId(e.target.value)} />
        <Button
          disabled={!joinLobby.isCallable}
          onClick={() => {
            joinLobby(roomId);
          }}>Join Meet</Button>
        {/* <h2 className="text-3xl text-red-500 font-extrabold">Initialized</h2>

        <Button
          disabled={!joinLobby.isCallable}
          onClick={() => {
            joinLobby(roomId);
          }}
        >
          JOIN_LOBBY
        </Button> */}
        <br />
        <br />
        <h2 className="text-3xl text-yellow-500 font-extrabold">Lobby</h2>
        <div className="flex gap-4 flex-wrap">
          <Button
            disabled={!fetchVideoStream.isCallable}
            onClick={fetchVideoStream}
          >
            Start Camera
          </Button>

          <Button
            disabled={!fetchAudioStream.isCallable}
            onClick={fetchAudioStream}
          >
            Unmute
          </Button>

          <Button disabled={!joinRoom.isCallable} onClick={joinRoom}>
            JOIN_ROOM
          </Button>

          <Button
            disabled={!state.matches('Initialized.JoinedLobby')}
            onClick={() => send('LEAVE_LOBBY')}
          >
            LEAVE_LOBBY
          </Button>

          <Button
            disabled={!stopVideoStream.isCallable}
            onClick={stopVideoStream}
          >
            Stop Camera
          </Button>
          <Button
            disabled={!stopAudioStream.isCallable}
            onClick={stopAudioStream}
          >
            Mute
          </Button>
        </div>
        <br />
        <h2 className="text-3xl text-green-600 font-extrabold">Room</h2>
        <div className="flex gap-4 flex-wrap">
          <Button
            disabled={!produceAudio.isCallable}
            onClick={() => produceAudio(micStream)}
          >
            PRODUCE_MIC
          </Button>

          <Button
            disabled={!produceVideo.isCallable}
            onClick={() => produceVideo(camStream)}
          >
            PRODUCE_CAM
          </Button>

          <Button
            disabled={!stopProducingAudio.isCallable}
            onClick={() => stopProducingAudio()}
          >
            STOP_PRODUCING_MIC
          </Button>

          <Button
            disabled={!stopProducingVideo.isCallable}
            onClick={() => stopProducingVideo()}
          >
            STOP_PRODUCING_CAM
          </Button>

          <Button disabled={!leaveRoom.isCallable} onClick={leaveRoom}>
            LEAVE_ROOM
          </Button>
        </div>
        <div>
          <h2 className="text-3xl text-green-600 font-extrabold">Recording</h2>
          <div className="flex gap-4 flex-wrap">
            <Button
              disabled={!startRecording.isCallable}
              onClick={() => {
                startRecording(`https://${window.location.href}/rec/${roomId}`)
              }}
            >
              START_RECORDING
            </Button>

            <Button
              disabled={!stopRecording.isCallable}
              onClick={() => {
                stopRecording()
                console.log('stop recording', data)
              }}
            >
              STOP_RECORDING
            </Button>
            <div>isStarting: {isStarting.toString()}</div>
            <div>inProgress: {inProgress.toString()}</div>
            <div>error: {error}</div>
          </div>

        </div>

        {/* Uncomment to see the Xstate Inspector */}
        {/* <Inspect /> */}
      </div>
      <div>
        Me Video:
        <video ref={videoRef} autoPlay muted></video>
        <div className="grid grid-cols-4">
          {Object.values(peers)
            .filter(peer => peer.cam)
            .map(peer => (
              <Video
                key={peer.peerId}
                peerId={peer.peerId}
                track={peer.cam}
                debug
              />
            ))}
          {Object.values(peers)
            .filter(peer => peer.mic)
            .map(peer => (
              <Audio key={peer.peerId} peerId={peer.peerId} track={peer.mic} />
            ))}
        </div>
      </div>
    </div>
  );
}

export async function createRoom () {
  // Fetch data from external API
  const { data: { data } } = await axios.post(
    'https://iriko.testing.huddle01.com/api/v1/create-room',
    {
      title: 'Huddle01-SDK-Test',
      hostWallets: ['0x7935468Da117590bA75d8EfD180cC5594aeC1582'],
      // tokenType: "ERC721",
      // chain: "ETHEREUM",
      // contractAddress: ["0xB000a4933107033A4E5483a1576EDA178F769508"],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
      },
    }
  );

  const { data: data1 } = await axios.post(`https://iriko.testing.huddle01.com/api/v1/join-room-token`,
    {
      roomId: data.roomId,
      userType: "host"
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
      },
    });
  console.log("Data from meeting details", data1)
  console.log(data)
  return {
    roomId: data.roomId,
  };

}