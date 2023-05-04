import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
// VwTZ4AGTxme9snANex9tep3NwvVMGfYd
import { useEventListener, useHuddle01 } from "@huddle01/react";
import { Audio, Video } from "@huddle01/react/components";
import Image from "next/image";
import {
  useAccount,
  useSignMessage,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import { getAccessToken, getMessage } from "@huddle01/auth";

import {
  useAudio,
  useLobby,
  useMeetingMachine,
  usePeers,
  useRoom,
  useVideo,
  useRecording,
} from "@huddle01/react/hooks";

import Button from "../components/Button";
import { ConnectKitButton } from "connectkit";
import {
  FILE_ACCESS_CONTRACT_ABI,
  FILE_ACCESS_CONTRACT_ADDRESS,
  SBT_CONTRACT_ABI,
  SBT_CONTRACT_ADDRESS,
} from "@/constants";

//React Icons
import { RiVideoAddFill } from "react-icons/ri";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import {
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsFillMicFill,
  BsFillMicMuteFill,
  BsRecordCircle,
} from "react-icons/bs";
import { MdCallEnd } from "react-icons/md";
import { BigNumber } from "ethers";

export default function Home () {
  const { address } = useAccount();
  const videoRef = useRef(null);
  const provider = useProvider();
  const { data: signer } = useSigner();
  const { state, send } = useMeetingMachine();
  const { startRecording, stopRecording, data: recordingData, isStarting, inProgress, error } =
    useRecording();
  const [roomId, setRoomId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [cid, setCid] = useState();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [iseRecording, setIsRecording] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
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

  useEffect(() => {
    if (recordingData) {
      console.log("recordingData", recordingData);
      fetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          file: recordingData.s3URL,
          hostWallet: address,
        }),
      });
    }
  }, [recordingData]);

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
      initialize(process.env.NEXT_PUBLIC_PROJECT_ID);
    }
  }, [isInitialized]);

  const handleCreateRoom = async () => {
    const { roomId } = await createRoom(address);
    setRoomId(roomId);
  };

  const handleJoinRoom = () => {
    if (roomId != "" && accessToken != "") joinLobby(roomId, accessToken);
    else alert("Please enter room id and sign the message");
    setIsDisabled(false);
    console.log("peers", peers);
  };

  useEventListener("lobby:cam-on", () => {
    if (state.context.camStream && videoRef.current)
      videoRef.current.srcObject = state.context.camStream;
  });

  useEventListener(
    "lobby:joined",
    () => {
      fetchVideoStream();
    },
    [fetchVideoStream.isCallable]
  );

  useEventListener(
    "lobby:cam-on",
    () => {
      fetchAudioStream();
    },
    [fetchAudioStream.isCallable]
  );

  const decryptFile = async () => {
    // const ownerAddress = '0x7904521174Bb111e4Fb416590F85116cddC2EA4E'
    if (address) {
      const fileList = await fileAccess?.getAllFilesByOwnerAddress(
        address
      );
      const newFile = fileList.at(-1);
      console.log("fileList", fileList);
      console.log("latest File", newFile);
      const fileId = newFile.id.toNumber()
      console.log("fileId", fileId);
      console.log("address", newFile.hash);
      const test2 = await fileAccess?.hasAccess(
        fileId,
        address,
        address
      );
      if (test2) {
        setCid(newFile.hash);
      } else {
        alert("You don't have access to this file");
      }
    } else {
      alert("Please connect your wallet");
    }
  };

  return (
    <div className=" my-5 ">
      {/* NAVBAR */}
      <div className=" flex justify-between items-center mx-5">
        <div>
          <img src="/light-logo.svg" alt="logo" />
        </div>
        <div className=" flex items-center gap-5">
          <div>
            <ConnectKitButton />
          </div>
          <div>
            {address && !accessToken && (
              <div>
                <Button
                  onClick={async () => {
                    const msg = await getMessage(address);
                    signMessage({ message: msg.message });
                  }}
                >
                  Sign Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HEADER SECTION */}
      <div className=" my-5 flex justify-center items-center">
        <div>
          <h1 className="text-4xl font-bold">
            Welcome to{" "}
            <a className="text-blue-600 font-black" href="https://huddle01.com">
              Huddle01 SDK!
            </a>
          </h1>

          <div className=" flex items-center gap-5 my-5">
            <Button onClick={() => handleCreateRoom()}>
              {" "}
              <RiVideoAddFill /> Create Meet
            </Button>
            <div className=" flex gap-1 items-center">
              <input
                id="roomId"
                type="text"
                placeholder="RoomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className=" px-5 py-3 rounded-lg bottom-2"
              />
              <Button disabled={!roomId} onClick={handleJoinRoom}>
                Join Meet
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* VIDEO BODY*/}
      <div className=" my-14">
        {/* Me Video: */}
        <div className="flex flex-wrap gap-5 items-center justify-center">
          <div className=" h-[17rem] w-[30rem] rounded-lg bg-slate-600 border-2 border-gray-400">
            <video
              className=" h-full w-full object-cover"
              ref={videoRef}
              autoPlay
              muted
            ></video>
          </div>
          {Object.values(peers)
            .filter((peer) => peer.cam)
            .map((peer) => (
              <div
                key={peer.peerId}
                className=" h-[20rem] w-[33rem] rounded-lg bg-slate-600 border-2 border-gray-400"
              >
                <Video
                  peerId={peer.peerId}
                  track={peer.cam}
                  debug
                  className=" h-full w-full object-cover"
                />
              </div>
            ))}
          {Object.values(peers)
            .filter((peer) => peer.mic)
            .map((peer) => (
              <Audio key={peer.peerId} peerId={peer.peerId} track={peer.mic} />
            ))}
        </div>
      </div>

      {/* FOOTER BUTTON SECTION */}
      <div className=" flex justify-evenly items-center fixed bottom-0 w-screen bg-gray-900 py-2">
        <div className="flex gap-4 flex-wrap">
          <Button disabled={!joinRoom.isCallable} onClick={joinRoom}>
            <FiLogIn className=" text-xl" /> Join room
          </Button>

          <Button
            disabled={!state.matches("Initialized.JoinedLobby")}
            onClick={() => send("LEAVE_LOBBY")}
          >
            Leave Lobby <FiLogOut className=" text-xl" />
          </Button>
        </div>

        <div
          className={`flex gap-4 flex-wrap ${isDisabled ? "opacity-50" : "opacity-100"
            }`}
        >
          <button
            className={` text-lg text-white p-5 rounded-full ${isMuted ? "bg-red-500" : "bg-gray-600"
              } ${isDisabled
                ? "cursor-not-allowed"
                : "cursor-pointer hover:scale-105"
              } `}
            onClick={() => {
              if (isMuted) {
                produceAudio(micStream);
                setIsMuted(false);
              } else {
                stopProducingAudio();
                setIsMuted(true);
              }
            }}
          >
            {isMuted ? <BsFillMicMuteFill /> : <BsFillMicFill />}
          </button>

          <button
            className={` text-lg text-white p-5 rounded-full ${isVideoEnabled ? "bg-gray-600 " : "bg-red-500"
              } ${isDisabled
                ? "cursor-not-allowed"
                : "cursor-pointer hover:scale-105"
              }`}
            onClick={() => {
              if (isVideoEnabled) {
                stopProducingVideo();
                setIsVideoEnabled(false);
              } else {
                produceVideo(camStream);
                setIsVideoEnabled(true);
              }
            }}
          >
            {isVideoEnabled ? <BsCameraVideoFill /> : <BsCameraVideoOffFill />}
          </button>

          <button
            className={` text-lg text-white p-5 rounded-full ${iseRecording ? "bg-gray-600 " : "bg-red-500"
              } ${isDisabled
                ? "cursor-not-allowed"
                : "cursor-pointer hover:scale-105"
              }`}
            onClick={async () => {
              if (iseRecording) {
                stopRecording();
                setIsRecording(false);
              } else {
                startRecording(`https://test-huddle.vercel.app/rec/${roomId}`);
                setIsRecording(true);
              }
            }}
          >
            <BsRecordCircle />
          </button>

          <button
            onClick={leaveRoom}
            className=" bg-red-500 text-white rounded-full p-5 text-lg"
          >
            <MdCallEnd />
          </button>

          <div className=" hidden">
            <div>isStarting: {isStarting.toString()}</div>
            <div>inProgress: {inProgress.toString()}</div>
            <div>error: {error}</div>
            {/* <div>data: {JSON.stringify(data)}</div> */}
          </div>
        </div>

        <div className=" flex items-center gap-4">
          <Button
            onClick={() => {
              decryptFile();
            }}
          >
            Decrypt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div>
          {cid && (
            <Video
              src={`/api/decrypt?cid=${cid}`}
              width={300}
              height={300}
              controls
            />
          )}
          <div className=" hidden">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export async function createRoom (address) {
  // Fetch data from external API
  const {
    data: { data },
  } = await axios.post(
    "https://iriko.testing.huddle01.com/api/v1/create-room",
    {
      title: "Huddle01-SDK-Test",
      hostWallets: [address],
      // tokenType: "ERC721",
      // chain: "FILECOIN",
      // contractAddress: [SBT_CONTRACT_ADDRESS],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
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
