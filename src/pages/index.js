import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
// VwTZ4AGTxme9snANex9tep3NwvVMGfYd
import { useEventListener, useHuddle01 } from '@huddle01/react';
import { Audio, Video } from '@huddle01/react/components';
import Image from 'next/image'
import { useAccount, useSignMessage, useContract, useSigner, useProvider } from "wagmi";
import { getAccessToken, getMessage } from "@huddle01/auth";

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
import { ConnectKitButton } from "connectkit";
import { FILE_ACCESS_CONTRACT_ABI, FILE_ACCESS_CONTRACT_ADDRESS, SBT_CONTRACT_ABI, SBT_CONTRACT_ADDRESS } from '@/constants';

export default function Home () {
  const { address } = useAccount();
  const videoRef = useRef(null);
  const provider = useProvider();
  const { data: signer } = useSigner();
  const { state, send } = useMeetingMachine();
  const { startRecording, stopRecording, data, isStarting, inProgress, error } = useRecording();
  const [roomId, setRoomId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [cid, setCid] = useState();
  // Event Listner

  const { initialize, isInitialized } = useHuddle01();
  const { joinLobby } = useLobby();
  const {
    fetchAudioStream,
    produceAudio,
    stopProducingAudio,
    stream: micStream,
  } = useAudio();
  const {
    fetchVideoStream,
    produceVideo,
    stopProducingVideo,
    stream: camStream,
  } = useVideo();
  const { joinRoom, leaveRoom } = useRoom();

  const { peers } = usePeers();

  const { signMessage } = useSignMessage({
    onSuccess: async (data) => {
      const token = await getAccessToken(data, address);
      console.log("token", token);
      setAccessToken(token.accessToken);
    },
  });

  const sbt = useContract({
    address: SBT_CONTRACT_ADDRESS,
    abi: SBT_CONTRACT_ABI,
    signerOrProvider: signer || provider,
  });

  const fileAccess = useContract({
    address: FILE_ACCESS_CONTRACT_ADDRESS,
    abi: FILE_ACCESS_CONTRACT_ABI,
    signerOrProvider: signer || provider,
  });

  useEffect(() => {
    if (!isInitialized) {
      initialize(process.env.NEXT_PUBLIC_PROJECT_ID)
    }
  }, [isInitialized]);

  const handleCreateRoom = async () => {
    const { roomId } = await createRoom();
    setRoomId(roomId);
  }

  const handleJoinRoom = () => {
    if (roomId != '' && accessToken != '')
      joinLobby(roomId, accessToken);
    else
      alert('Please enter room id and sign the message');

    console.log("peers", peers)
  }

  useEventListener('lobby:cam-on', () => {
    if (state.context.camStream && videoRef.current)
      videoRef.current.srcObject = state.context.camStream;
  });

  useEventListener("lobby:joined", () => {
    fetchVideoStream();
  }, [fetchVideoStream.isCallable]);

  useEventListener("lobby:cam-on", () => {
    fetchAudioStream();
  }, [fetchAudioStream.isCallable]);

  const uploadFile = async () => {
    const response = await fetch('/api/upload');
    const { response: { data } } = await response.json();
    setCid(data.Hash);
  };

  const decryptFile = async (fileId, cid) => {
    if (address) {
      const test2 = await fileAccess?.hasAccess(fileId, '0x7935468Da117590bA75d8EfD180cC5594aeC1582', address);
      const fileList = await fileAccess?.getAllFilesByOwnerAddress('0x7935468Da117590bA75d8EfD180cC5594aeC1582');
      console.log("fileList", fileList)
      if (test2) {
        const response = await axios.get(`/api/decrypt?cid=${cid}`);
        // console.log("response", response.data);
        setCid(cid);
      } else {
        alert("You don't have access to this file");
      }
    } else {
      alert("Please connect your wallet");
    }
  };

  return (
    <div className="grid grid-cols-2">
      <div>
        <h1 className="text-6xl font-bold">
          Welcome to{' '}
          <a className="text-blue-600" href="https://huddle01.com">
            Huddle01 SDK!
          </a>
        </h1>
        <ConnectKitButton />
        {(address && !accessToken) && (
          <div>
            <Button
              onClick={async () => {
                const msg = await getMessage(address);
                signMessage({ message: msg.message });
              }}>
              Sign Message
            </Button>
          </div>
        )}
        {/* QmXj3ELhSRcRUfXzvdcbuRPJPykyzEpkFVHeVkLsY7KEpj */}
        {/* <Video src='/api/decrypt?cid=QmXj3ELhSRcRUfXzvdcbuRPJPykyzEpkFVHeVkLsY7KEpj' width={300} height={300} controls /> */}
        {cid && <Video src={`/api/decrypt?cid=${cid}`} width={300} height={300} controls />}
        {/* {cid && <Image src={`/api/decrypt?cid=${cid}`} width={300} height={300} />} */}
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
        <Button onClick={() => { decryptFile(0, "QmXj3ELhSRcRUfXzvdcbuRPJPykyzEpkFVHeVkLsY7KEpj") }}>Decrypt</Button>
        <Button onClick={uploadFile}>Upload File</Button><br />
        <Button onClick={() => handleCreateRoom()}>Create Meet</Button>
        <br />
        <input id="roomId" type="text" placeholder='RoomId' value={roomId}
          onChange={(e) => setRoomId(e.target.value)} />
        <Button
          disabled={!joinLobby.isCallable}
          onClick={handleJoinRoom}>Join Meet</Button>
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
          {/* <Button
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
          </Button> */}

          <Button disabled={!joinRoom.isCallable} onClick={joinRoom}>
            JOIN_ROOM
          </Button>

          <Button
            disabled={!state.matches('Initialized.JoinedLobby')}
            onClick={() => send('LEAVE_LOBBY')}
          >
            LEAVE_LOBBY
          </Button>

          {/* <Button
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
          </Button> */}
        </div>
        <br />
        <h2 className="text-3xl text-green-600 font-extrabold">Room</h2>
        <div className="flex gap-4 flex-wrap">
          <Button
            disabled={!produceAudio.isCallable}
            onClick={() => produceAudio(micStream)}
          >
            Unmute
          </Button>

          <Button
            disabled={!produceVideo.isCallable}
            onClick={() => produceVideo(camStream)}
          >
            Start video
          </Button>

          <Button
            disabled={!stopProducingAudio.isCallable}
            onClick={() => stopProducingAudio()}
          >
            Mute
          </Button>

          <Button
            disabled={!stopProducingVideo.isCallable}
            onClick={() => stopProducingVideo()}
          >
            Stop video
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
                startRecording(`https://test-huddle.vercel.app/rec/${roomId}`)
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
            <div>data: {JSON.stringify(data)}</div>
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

  // const { data: data1 } = await axios.post(`https://iriko.testing.huddle01.com/api/v1/join-room-token`,
  //   {
  //     roomId: data.roomId,
  //     userType: "host"
  //   },
  //   {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
  //     },
  //   });
  // console.log("Data from meeting details", data1)
  // console.log(data)
  return {
    roomId: data.roomId,
    // accessToken: data1.token
  };

}