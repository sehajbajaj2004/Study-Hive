// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { io } from "socket.io-client";
// import generateRoomId from "../utils/generateRoomId";
// import VideoChat from "../components/VideoChat";

// const StandaloneVideoChat = () => {
//   const { roomId } = useParams();
//   const navigate = useNavigate();
//   const [finalRoomId, setFinalRoomId] = useState(roomId);
//   const [socket, setSocket] = useState(null);
//   const [userId, setUserId] = useState("");

//   useEffect(() => {
//     if (!roomId) {
//       const newRoomId = generateRoomId();
//       setFinalRoomId(newRoomId);
//       navigate(`/video/${newRoomId}`, { replace: true });
//     }
//   }, [roomId, navigate]);

//   useEffect(() => {
//     const newSocket = io("http://localhost:5000"); // your backend
//     setSocket(newSocket);

//     const storedUserId = localStorage.getItem("videoUserId");
//     if (storedUserId) {
//       setUserId(storedUserId);
//     } else {
//       const newUserId = `Guest_${Math.floor(Math.random() * 1000)}`;
//       localStorage.setItem("videoUserId", newUserId);
//       setUserId(newUserId);
//     }

//     return () => {
//       newSocket.disconnect();
//     };
//   }, []);

//   if (!socket || !userId) return <div className="text-white p-4">Loading...</div>;

//   return (
//     <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
//       <header className="p-4 border-b border-[#1E293B]">
//         <h1 className="text-2xl font-bold">StudyHive Video Chat</h1>
//         <p className="text-sm text-gray-400 mt-2">
//           Share this link to invite others: <br />
//           <span className="text-blue-400">{window.location.href}</span>
//         </p>
//       </header>

//       <main className="flex-1 flex items-center justify-center p-4">
//         <VideoChat
//           socket={socket}
//           roomId={finalRoomId}
//           userId={userId}
//           isOpen={true} // always open
//         />
//       </main>

//       <footer className="p-4 text-center text-sm text-gray-500">
//         StudyHive © 2025
//       </footer>
//     </div>
//   );
// };

// export default StandaloneVideoChat;

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import generateRoomId from "../utils/generateRoomId";
import VideoControls from "../components/VideoControls";
import UserVideoTile from "../components/UserVideoTile";

const StandaloneVideoChat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [finalRoomId, setFinalRoomId] = useState(roomId);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [screenSharing, setScreenSharing] = useState(false);
  const videoRefs = useRef({});
  const screenShareRef = useRef(null);
  const peerConnections = useRef({});
  const localStream = useRef(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  useEffect(() => {
    if (!roomId) {
      const newRoomId = generateRoomId();
      setFinalRoomId(newRoomId);
      navigate(`/video/${newRoomId}`, { replace: true });
    }
  }, [roomId, navigate]);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    let id = localStorage.getItem("videoUserId");
    if (!id) {
      id = `Guest_${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem("videoUserId", id);
    }
    setUserId(id);

    newSocket.emit("join-video-room", { roomId: finalRoomId, userId: id });

    newSocket.on("user-list", (userList) => {
      setUsers(userList);
    });

    newSocket.on("user-joined", async (newUserId) => {
        if (newUserId === userId) return;
      
        const peerConnection = createPeerConnection(newUserId);
      
        // Always add tracks before creating offer
        if (localStream.current) {
          localStream.current.getTracks().forEach(track => {
            const alreadyAdded = peerConnection.getSenders().find(s => s.track === track);
            if (!alreadyAdded) peerConnection.addTrack(track, localStream.current);
          });
        }
      
        const polite = userId > newUserId;
        
        if (polite) return; // Wait for offer if you are polite peer
      
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        newSocket.emit("offer", { to: newUserId, offer });
      });
      

      newSocket.on("offer", async ({ from, offer }) => {
        const peerConnection = createPeerConnection(from);
      
        if (localStream.current) {
          localStream.current.getTracks().forEach(track => {
            const alreadyAdded = peerConnection.getSenders().find(s => s.track === track);
            if (!alreadyAdded) peerConnection.addTrack(track, localStream.current);
          });
        }
      
        const polite = userId > from;
      
        if (peerConnection.signalingState !== "stable") {
          if (polite) {
            await peerConnection.setLocalDescription({ type: "rollback" });
          } else {
            console.log("Impolite: ignoring offer due to collision");
            return;
          }
        }
      
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        newSocket.emit("answer", { to: from, answer });
      });
      

    newSocket.on("answer", async ({ from, answer }) => {
      const peerConnection = peerConnections.current[from];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    newSocket.on("ice-candidate", async ({ from, candidate }) => {
      const peerConnection = peerConnections.current[from];
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [finalRoomId, userId, navigate]);

  useEffect(() => {
    if (userId && videoRefs.current[userId]) {
      addLocalStream();
    }
  }, [userId, users]);

  const addLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;

      if (videoRefs.current[userId]) {
        videoRefs.current[userId].srcObject = stream;
        videoRefs.current[userId].stream = stream;
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  const createPeerConnection = (targetUserId) => {
    if (peerConnections.current[targetUserId]) return peerConnections.current[targetUserId];

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.ontrack = (event) => {
      if (videoRefs.current[targetUserId]) {
        videoRefs.current[targetUserId].srcObject = event.streams[0];
        videoRefs.current[targetUserId].stream = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: targetUserId, candidate: event.candidate });
      }
    };

    peerConnections.current[targetUserId] = peerConnection;
    return peerConnection;

    
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    localStream.current.getAudioTracks().forEach(track => {
      track.enabled = !isAudioEnabled;
    });
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    localStream.current.getVideoTracks().forEach(track => {
      track.enabled = !isVideoEnabled;
    });
  };

  const leaveRoom = () => {
    navigate("/");
    window.location.reload();
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenSharing(true);

      if (screenShareRef.current) {
        screenShareRef.current.srcObject = screenStream;
      }

      screenStream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = null;
        }
      };
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      <header className="p-4 border-b border-[#1E293B]">
        <h1 className="text-2xl font-bold">StudyHive Video Chat</h1>
        <p className="text-sm text-gray-400 mt-2">
          Share this link: <span className="text-blue-400">{window.location.href}</span>
        </p>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {users.map((u) => (
          <UserVideoTile
            key={u}
            userId={u}
            isSpeaking={false}
            isLocal={u === userId}
            videoRef={(ref) => {
              videoRefs.current[u] = ref;
            }}
          />
        ))}

        {screenSharing && (
          <div className="relative rounded overflow-hidden border-2 border-blue-400">
            <video ref={screenShareRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Your Screen
            </div>
          </div>
        )}
      </main>

      <VideoControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        leaveRoom={leaveRoom}
        // startScreenShare={startScreenShare}
      />
    </div>
  );
};

export default StandaloneVideoChat;
