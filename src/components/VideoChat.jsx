import React, { useEffect, useRef, useState } from "react";
import "../styles/videochat.css";

const VideoChat = ({ socket, roomId, userId, isOpen }) => {
  const [localStream, setLocalStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef(null);
  const peerConnections = useRef({});

  // Initialize video when component mounts
  useEffect(() => {
    if (!isOpen) return;
    
    let stream;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Join the video room with the same roomId as chat
        socket.emit("join-video-room", { roomId, userId });
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    init();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Close all peer connections
      Object.values(peerConnections.current).forEach(peer => peer.close());
      peerConnections.current = {};
    };
  }, [socket, roomId, userId, isOpen]);

  // Handle socket events for WebRTC
  useEffect(() => {
    if (!socket || !localStream) return;

    const handleUserJoined = (newUserId) => {
      if (newUserId === userId || peerConnections.current[newUserId]) return;
      const peer = createPeer(newUserId);
      localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
      peerConnections.current[newUserId] = peer;
    };

    const handleOffer = async ({ from, offer }) => {
      const peer = createPeer(from, true);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    };

    const handleAnswer = async ({ from, answer }) => {
      const peer = peerConnections.current[from];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      const peer = peerConnections.current[from];
      if (peer && candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    // Register socket event listeners
    socket.on("user-joined", handleUserJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    // Cleanup function
    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket, localStream, userId, roomId]);

  // Creates a peer connection
  const createPeer = (targetId, isReceiver = false) => {
    const peer = new RTCPeerConnection({ 
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }] 
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { to: targetId, candidate: e.candidate });
      }
    };

    peer.ontrack = (e) => {
      const remoteContainer = remoteVideosRef.current;
      if (!remoteContainer) return;

      // Create or get existing video element for this user
      let video = document.getElementById(`video-${targetId}`);
      if (!video) {
        const videoContainer = document.createElement("div");
        videoContainer.className = "remote-video-container";
        
        video = document.createElement("video");
        video.id = `video-${targetId}`;
        video.autoplay = true;
        video.playsInline = true;
        
        const label = document.createElement("div");
        label.className = "video-label";
        label.textContent = targetId;
        
        videoContainer.appendChild(video);
        videoContainer.appendChild(label);
        remoteContainer.appendChild(videoContainer);
      }
      
      if (!video.srcObject) {
        video.srcObject = new MediaStream();
      }
      video.srcObject.addTrack(e.track);
    };

    if (!isReceiver) {
      peer.onnegotiationneeded = async () => {
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("offer", { to: targetId, offer });
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      };
    }

    return peer;
  };

  // Toggle video on/off
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle audio on/off
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="video-chat-container">
      <div className="video-grid">
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`local-video ${!isVideoEnabled ? 'video-off' : ''}`}
          />
          <div className="video-label">You ({userId})</div>
        </div>
        <div ref={remoteVideosRef} className="remote-videos"></div>
      </div>
      
      <div className="video-controls">
        <button 
          onClick={toggleVideo} 
          className={`control-button ${!isVideoEnabled ? 'control-off' : ''}`}
        >
          {isVideoEnabled ? '🎥 Disable Video' : '🎥 Enable Video'}
        </button>
        <button 
          onClick={toggleAudio} 
          className={`control-button ${!isAudioEnabled ? 'control-off' : ''}`}
        >
          {isAudioEnabled ? '🎤 Mute Audio' : '🎤 Unmute Audio'}
        </button>
      </div>
    </div>
  );
};

export default VideoChat;