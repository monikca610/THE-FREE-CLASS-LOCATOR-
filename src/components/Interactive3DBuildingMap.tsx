import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Building,
  Layers,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Compass,
  Users,
  Wind,
  Tv,
  Monitor,
  BookmarkCheck,
  ChevronRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { RoomLiveStatus, DayOfWeek } from '../types';
import { formatMinutesToTime } from '../utils/statusEngine';
import { LiveCountdownTimer } from './LiveCountdownTimer';
import { SquadShareButton } from './SquadShareButton';
import { CAMPUS_INFO } from '../data/timetableData';

interface Interactive3DBuildingMapProps {
  roomsStatus: RoomLiveStatus[];
  currentDay: DayOfWeek;
  currentTimeMinutes: number;
  isSimulated: boolean;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onOpenDetails: (roomId: string) => void;
  onClaimRoom: (roomId: string) => void;
  onReleaseClaim: (roomId: string) => void;
}

const FLOOR_KEYS = [
  { value: 'all', label: 'All Floors (SRM Trichy FET Stack)', floorNum: null },
  { value: '0', label: 'Ground Floor (Labs & Auditorium)', floorNum: 0 },
  { value: '1', label: '1st Floor (CSE & AI/ML Suites)', floorNum: 1 },
  { value: '2', label: '2nd Floor (Data Science & Cyber)', floorNum: 2 },
  { value: '3', label: '3rd Floor (Software & VLSI)', floorNum: 3 },
  { value: '4', label: '4th Floor (Research & AI Hub)', floorNum: 4 },
];

export const Interactive3DBuildingMap: React.FC<Interactive3DBuildingMapProps> = ({
  roomsStatus,
  currentDay,
  currentTimeMinutes,
  isSimulated,
  selectedRoomId,
  onSelectRoom,
  onOpenDetails,
  onClaimRoom,
  onReleaseClaim,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeFloorFilter, setActiveFloorFilter] = useState<string>('all');
  const [mapSearch, setMapSearch] = useState<string>('');
  const [onlyFreeFilter, setOnlyFreeFilter] = useState<boolean>(false);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [viewPreset, setViewPreset] = useState<'iso' | 'top' | 'front'>('iso');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);

  // References for Three.js scene
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const roomMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animationFrameId = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4.2,
    phi: Math.PI / 3.4,
    radius: 46,
  });

  // Color Palette conforming to Phase 2 requirements
  const STATUS_COLORS = {
    available: 0x10b981,   // Emerald Green
    occupied: 0xef4444,    // Crimson Red
    warning: 0xf59e0b,     // Amber / Yellow (Kick-out soon)
    unavailable: 0x94a3b8, // Slate Gray
    selectedRim: 0x2563eb, // Cobalt Blue Highlight
    corridor: 0xe2e8f0,
  };

  const getRoomColorHex = (roomStatusItem: RoomLiveStatus | undefined) => {
    if (!roomStatusItem) return STATUS_COLORS.unavailable;
    if (roomStatusItem.status === 'BUSY') return STATUS_COLORS.occupied;
    if (roomStatusItem.status === 'BUSY_SOON') return STATUS_COLORS.warning;
    if (roomStatusItem.status === 'FREE' || roomStatusItem.status === 'FREE_SOON') return STATUS_COLORS.available;
    return STATUS_COLORS.unavailable;
  };

  // Accurate spatial mapping for SRM Tiruchirappalli (FET Academic Complex)
  // Layout includes:
  // - Kalam Wing (West, x: -7.5 to -4.0)
  // - Raman Wing (East, x: 4.0 to 7.5)
  // - Central Atrium Core & Auditorium Wing (x: -3.5 to 3.5)
  const getRoomPosition = (room: RoomLiveStatus['room']) => {
    const floorIndex = room.floor;
    const yBase = floorIndex * 5.0; // Stacking clearance

    let x = 0;
    let z = 0;
    let width = 4.8;
    let depth = 3.8;
    const height = 2.4;

    const id = room.id;

    // Ground Floor
    if (id === 'TRP G01') {
      x = 0; z = -6.5; width = 8.5; depth = 5.0; // Auditorium wing
    } else if (id === 'TRP G02') {
      x = -6.5; z = -1.5; width = 5.2; depth = 4.2; // Turing Computing Lab
    } else if (id === 'TRP G05') {
      x = 6.5; z = -1.5; width = 5.2; depth = 4.2; // IoT Lab
    } else if (id === 'TRP G08') {
      x = 6.5; z = 3.5; width = 5.2; depth = 4.2; // CAD/CAM Lab
    } else if (id === 'TRP G10') {
      x = 0; z = 4.0; width = 7.5; depth = 4.5; // Kalam Seminar Hall
    }
    // 1st Floor
    else if (id === 'TRP 101') {
      x = -6.5; z = -2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 102') {
      x = 6.5; z = -2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 105') {
      x = 0; z = 0; width = 6.5; depth = 4.5; // Central Cloud Lab
    } else if (id === 'TRP 108') {
      x = 6.5; z = 2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 112') {
      x = -6.5; z = 2.5; width = 5.0; depth = 4.0;
    }
    // 2nd Floor
    else if (id === 'TRP 201') {
      x = -6.5; z = -2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 203') {
      x = 6.5; z = -2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 206') {
      x = 0; z = -1.5; width = 6.0; depth = 4.2;
    } else if (id === 'TRP 210') {
      x = 6.5; z = 2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 215') {
      x = 0; z = 3.5; width = 6.2; depth = 4.2;
    }
    // 3rd Floor
    else if (id === 'TRP 301') {
      x = -6.5; z = -2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 304') {
      x = 6.5; z = -2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 308') {
      x = 6.5; z = 2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 312') {
      x = -6.5; z = 2.5; width = 5.0; depth = 4.0;
    } else if (id === 'TRP 316') {
      x = 0; z = 1.0; width = 6.2; depth = 4.2;
    }
    // 4th Floor
    else if (id === 'TRP 401') {
      x = -6.5; z = -1.5; width = 5.2; depth = 4.4;
    } else if (id === 'TRP 405') {
      x = 0; z = 0; width = 7.0; depth = 4.8;
    } else if (id === 'TRP 408') {
      x = 6.5; z = -1.5; width = 5.2; depth = 4.4;
    } else if (id === 'TRP 412') {
      x = -6.5; z = 3.2; width = 5.2; depth = 4.4;
    }

    return { x, y: yBase + 1.25, z, width, depth, height, floorY: yBase };
  };

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Crisp architectural light canvas
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Warm daylight & architectural ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.88);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbf0, 0.95);
    dirLight.position.set(30, 55, 35);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    fillLight.position.set(-25, 30, -25);
    scene.add(fillLight);

    // SRM Tiruchirappalli Campus Quadrangle Ground
    const campusGroundGeo = new THREE.PlaneGeometry(70, 70);
    const campusGroundMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8,
      metalness: 0.05,
    });
    const campusGround = new THREE.Mesh(campusGroundGeo, campusGroundMat);
    campusGround.rotation.x = -Math.PI / 2;
    campusGround.position.y = -0.1;
    campusGround.receiveShadow = true;
    scene.add(campusGround);

    // Central Green Courtyard Lawn
    const lawnGeo = new THREE.BoxGeometry(16, 0.1, 12);
    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0xdcfce7, // Light green lawn
      roughness: 0.9,
    });
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.position.set(0, 0, 0);
    lawn.receiveShadow = true;
    scene.add(lawn);

    // Campus Quadrangle Road & Paver Lines
    const grid = new THREE.GridHelper(50, 25, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -0.05;
    scene.add(grid);

    // Render loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      if (isAutoRotate) {
        cameraAngleRef.current.theta += 0.004;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, []);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    const targetY = activeFloorFilter === 'all' ? 10 : parseInt(activeFloorFilter, 10) * 5.0;
    cameraRef.current.lookAt(0, targetY, 0);
  };

  // Rebuild SRM Tiruchirappalli 3D model whenever roomsStatus, floor filter, or selection changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old meshes
    roomMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    roomMeshesRef.current.clear();

    const existingChildren = [...scene.children];
    existingChildren.forEach((child) => {
      if (child.userData?.isBuildingPart) {
        scene.remove(child);
      }
    });

    const floorsToRender =
      activeFloorFilter === 'all'
        ? [0, 1, 2, 3, 4]
        : [parseInt(activeFloorFilter, 10)];

    // Render floor plates, wings, pillars, glass atriums and classrooms
    floorsToRender.forEach((floorNum) => {
      const ySlab = floorNum * 5.0;

      // 1. SRM Trichy West Wing Floor Slab (Dr. APJ Abdul Kalam Wing)
      const kalamSlabGeo = new THREE.BoxGeometry(9.0, 0.35, 15.0);
      const kalamSlabMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.05,
      });
      const kalamSlab = new THREE.Mesh(kalamSlabGeo, kalamSlabMat);
      kalamSlab.position.set(-6.5, ySlab, 0.5);
      kalamSlab.receiveShadow = true;
      kalamSlab.userData = { isBuildingPart: true, floor: floorNum };
      scene.add(kalamSlab);

      // 2. SRM Trichy East Wing Floor Slab (Sir C.V. Raman Wing)
      const ramanSlabGeo = new THREE.BoxGeometry(9.0, 0.35, 15.0);
      const ramanSlab = new THREE.Mesh(ramanSlabGeo, kalamSlabMat);
      ramanSlab.position.set(6.5, ySlab, 0.5);
      ramanSlab.receiveShadow = true;
      ramanSlab.userData = { isBuildingPart: true, floor: floorNum };
      scene.add(ramanSlab);

      // 3. Central Atrium & Walkway Bridge
      const atriumSlabGeo = new THREE.BoxGeometry(8.0, 0.35, 13.0);
      const atriumSlab = new THREE.Mesh(atriumSlabGeo, kalamSlabMat);
      atriumSlab.position.set(0, ySlab, 0.5);
      atriumSlab.receiveShadow = true;
      atriumSlab.userData = { isBuildingPart: true, floor: floorNum };
      scene.add(atriumSlab);

      // Walkway Corridors
      const corridorGeo = new THREE.BoxGeometry(22.0, 0.05, 3.0);
      const corridorMat = new THREE.MeshBasicMaterial({ color: STATUS_COLORS.corridor });
      const corridor = new THREE.Mesh(corridorGeo, corridorMat);
      corridor.position.set(0, ySlab + 0.2, 0);
      corridor.userData = { isBuildingPart: true };
      scene.add(corridor);

      // Architectural Pillars (Trichy Campus Portico & Wing Supports)
      const pillarPositions = [
        [-10.5, -6.5],
        [-10.5, 7.5],
        [10.5, -6.5],
        [10.5, 7.5],
        [-2.5, -6.5],
        [2.5, -6.5],
      ];
      pillarPositions.forEach(([px, pz]) => {
        const pGeo = new THREE.CylinderGeometry(0.3, 0.3, 5.0, 16);
        const pMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
        const pillar = new THREE.Mesh(pGeo, pMat);
        pillar.position.set(px, ySlab + 2.5, pz);
        pillar.userData = { isBuildingPart: true };
        scene.add(pillar);
      });

      // Ground Floor Grand Entrance Portico & Signboard
      if (floorNum === 0) {
        // Grand Front Columns
        for (let i = -3; i <= 3; i += 2) {
          const colGeo = new THREE.CylinderGeometry(0.45, 0.45, 5.2, 16);
          const colMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
          const col = new THREE.Mesh(colGeo, colMat);
          col.position.set(i * 1.8, 2.6, -9.5);
          col.castShadow = true;
          col.userData = { isBuildingPart: true };
          scene.add(col);
        }

        // Portico Pediment Roof
        const pedimentGeo = new THREE.BoxGeometry(14, 0.7, 4.5);
        const pedimentMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }); // Dark slate
        const pediment = new THREE.Mesh(pedimentGeo, pedimentMat);
        pediment.position.set(0, 5.3, -9.5);
        pediment.userData = { isBuildingPart: true };
        scene.add(pediment);

        // Signage block: "SRM TIRUCHIRAPPALLI"
        const signGeo = new THREE.BoxGeometry(11, 0.8, 0.2);
        const signMat = new THREE.MeshStandardMaterial({
          color: 0xd97706, // SRM Amber / Golden
          roughness: 0.3,
          metalness: 0.2,
        });
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signMesh.position.set(0, 5.4, -11.8);
        signMesh.userData = { isBuildingPart: true };
        scene.add(signMesh);
      }

      // Rooftop Photovoltaic Solar Array & Pavilion (Visible on Top Floor)
      if (floorNum === 4 || activeFloorFilter === '4') {
        const roofSlabGeo = new THREE.BoxGeometry(23.0, 0.35, 17.0);
        const roofSlabMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
        const roofSlab = new THREE.Mesh(roofSlabGeo, roofSlabMat);
        roofSlab.position.set(0, ySlab + 5.0, 0.5);
        roofSlab.userData = { isBuildingPart: true };
        scene.add(roofSlab);

        // Solar Panels (West & East Roof)
        const panelMat = new THREE.MeshStandardMaterial({
          color: 0x1e3a8a, // Deep solar blue
          roughness: 0.1,
          metalness: 0.8,
        });
        for (let spX = -8; spX <= -4; spX += 2.2) {
          for (let spZ = -4; spZ <= 4; spZ += 2.8) {
            const solarGeo = new THREE.BoxGeometry(1.8, 0.1, 2.2);
            const solarMesh = new THREE.Mesh(solarGeo, panelMat);
            solarMesh.position.set(spX, ySlab + 5.3, spZ);
            solarMesh.rotation.x = 0.2;
            solarMesh.userData = { isBuildingPart: true };
            scene.add(solarMesh);
          }
        }
        for (let spX = 4; spX <= 8; spX += 2.2) {
          for (let spZ = -4; spZ <= 4; spZ += 2.8) {
            const solarGeo = new THREE.BoxGeometry(1.8, 0.1, 2.2);
            const solarMesh = new THREE.Mesh(solarGeo, panelMat);
            solarMesh.position.set(spX, ySlab + 5.3, spZ);
            solarMesh.rotation.x = 0.2;
            solarMesh.userData = { isBuildingPart: true };
            scene.add(solarMesh);
          }
        }
      }

      // Rooms on this floor
      const roomsOnFloor = roomsStatus.filter((r) => r.room.floor === floorNum);

      roomsOnFloor.forEach((item) => {
        const coords = getRoomPosition(item.room);
        const color = getRoomColorHex(item);
        const isSelected = selectedRoomId === item.room.id;
        const isHovered = hoveredRoomId === item.room.id;

        const roomHeight = isSelected ? coords.height + 0.6 : coords.height;
        const roomY = isSelected ? coords.y + 0.3 : coords.y;

        const roomGeo = new THREE.BoxGeometry(coords.width, roomHeight, coords.depth);
        const roomMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.25,
          metalness: 0.1,
          transparent: true,
          opacity: 0.93,
        });

        const roomMesh = new THREE.Mesh(roomGeo, roomMat);
        roomMesh.position.set(coords.x, roomY, coords.z);
        roomMesh.castShadow = true;
        roomMesh.receiveShadow = true;
        roomMesh.userData = {
          roomId: item.room.id,
          isRoom: true,
          isBuildingPart: true,
        };

        // Wireframe edges with blue highlight for selected
        const edges = new THREE.EdgesGeometry(roomGeo);
        const lineMat = new THREE.LineBasicMaterial({
          color: isSelected ? 0x2563eb : isHovered ? 0xffffff : 0x0f172a,
          linewidth: isSelected ? 3 : 1,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.22,
        });
        const wireframe = new THREE.LineSegments(edges, lineMat);
        roomMesh.add(wireframe);

        scene.add(roomMesh);
        roomMeshesRef.current.set(item.room.id, roomMesh);
      });
    });

    updateCameraPosition();
  }, [roomsStatus, activeFloorFilter, selectedRoomId, hoveredRoomId]);

  // Drag rotation handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = mountRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    // Raycast on hover
    if (cameraRef.current && sceneRef.current) {
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
      const roomHit = intersects.find((hit) => hit.object.userData?.isRoom);
      if (roomHit) {
        setHoveredRoomId(roomHit.object.userData.roomId);
        container.style.cursor = 'pointer';
      } else {
        setHoveredRoomId(null);
        container.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
      }
    }

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      cameraAngleRef.current.theta -= deltaX * 0.007;
      cameraAngleRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2.05, cameraAngleRef.current.phi - deltaY * 0.007)
      );

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current || !mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
    const roomHit = intersects.find((hit) => hit.object.userData?.isRoom);

    if (roomHit && roomHit.object.userData.roomId) {
      onSelectRoom(roomHit.object.userData.roomId);
    }
  };

  const handleZoom = (delta: number) => {
    cameraAngleRef.current.radius = Math.max(18, Math.min(75, cameraAngleRef.current.radius + delta));
    updateCameraPosition();
  };

  const setPreset = (preset: 'iso' | 'top' | 'front') => {
    setViewPreset(preset);
    setIsAutoRotate(false);
    if (preset === 'iso') {
      cameraAngleRef.current = { theta: Math.PI / 4.2, phi: Math.PI / 3.4, radius: 46 };
    } else if (preset === 'top') {
      cameraAngleRef.current = { theta: 0, phi: 0.12, radius: 50 };
    } else if (preset === 'front') {
      cameraAngleRef.current = { theta: 0, phi: Math.PI / 2.3, radius: 44 };
    }
    updateCameraPosition();
  };

  // Filtered rooms list for the quick picker / inspector
  const filteredRooms = useMemo(() => {
    return roomsStatus.filter((item) => {
      if (activeFloorFilter !== 'all' && item.room.floor.toString() !== activeFloorFilter) {
        return false;
      }
      if (onlyFreeFilter && item.status === 'BUSY') {
        return false;
      }
      if (mapSearch) {
        const s = mapSearch.toLowerCase();
        return (
          item.room.name.toLowerCase().includes(s) ||
          item.room.block.toLowerCase().includes(s) ||
          item.room.type.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [roomsStatus, activeFloorFilter, onlyFreeFilter, mapSearch]);

  const activeRoomItem = useMemo(() => {
    return roomsStatus.find((r) => r.room.id === selectedRoomId) || null;
  }, [roomsStatus, selectedRoomId]);

  return (
    <div className="space-y-4">
      {/* SRM Tiruchirappalli Model Header & Campus Badge */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-2xs shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                SRM Tiruchirappalli · 3D Academic Complex
              </h2>
              <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                FET Engineering Block
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{CAMPUS_INFO.location}</span>
            </p>
          </div>
        </div>

        {/* View Perspective Presets & Auto-Rotate Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start md:self-auto">
          <button
            onClick={() => setPreset('iso')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              viewPreset === 'iso' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Isometric
          </button>
          <button
            onClick={() => setPreset('top')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              viewPreset === 'top' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top-Down
          </button>
          <button
            onClick={() => setPreset('front')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              viewPreset === 'front' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Elevation
          </button>
          <button
            onClick={() => setIsAutoRotate((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              isAutoRotate ? 'bg-amber-500 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle 360° Auto-Rotation"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Rotate</span>
          </button>
        </div>
      </div>

      {/* Main 3D Viewport & Interactive Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3D Viewport Column (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Floor Slice Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {FLOOR_KEYS.map((fk) => (
              <button
                key={fk.value}
                onClick={() => {
                  setActiveFloorFilter(fk.value);
                  updateCameraPosition();
                }}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all font-medium flex items-center gap-1.5 ${
                  activeFloorFilter === fk.value
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{fk.label}</span>
              </button>
            ))}
          </div>

          {/* Canvas Container with Overlaid Architectural HUD */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 bg-gradient-to-b from-slate-100 to-slate-200 shadow-xs h-[480px] sm:h-[550px]">
            {/* Three.js mount element */}
            <div
              ref={mountRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={handleClick}
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            />

            {/* Overlaid Campus Architecture Badge */}
            <div className="absolute top-4 left-4 pointer-events-none bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-sm max-w-xs sm:max-w-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  SRM Tiruchirappalli Campus
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                Faculty of Engineering & Technology
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                West: Kalam Wing · East: Raman Wing · Center: Atrium
              </p>
            </div>

            {/* Interactive 3D Legend */}
            <div className="absolute top-4 right-4 pointer-events-none bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-sm space-y-1.5 text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Status Key
              </span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs"></span>
                <span className="text-slate-700 font-medium">Available (Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-2xs"></span>
                <span className="text-slate-700 font-medium">Occupied (In Session)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-2xs"></span>
                <span className="text-slate-700 font-medium">Kick-Out Soon (&le;20m)</span>
              </div>
            </div>

            {/* Floating Zoom / Reset HUD Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-md">
              <button
                onClick={() => handleZoom(-5)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(5)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreset('iso')}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Hover Tooltip when cursor points at a room */}
            {hoveredRoomId && (
              <div className="absolute bottom-4 left-4 pointer-events-none bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 text-xs font-medium flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Click <strong className="text-amber-400 font-bold">{hoveredRoomId}</strong> to inspect & share
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Inspector & Room Details Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Quick Search & Free Filter */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                placeholder="Search TRP 101, Turing, Lab, G05..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={onlyFreeFilter}
                  onChange={(e) => setOnlyFreeFilter(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Show only available rooms</span>
              </label>

              <span className="font-mono text-slate-400 text-[11px]">
                {filteredRooms.length} room{filteredRooms.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Selected Room Inspector Panel */}
          {activeRoomItem ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex-1 flex flex-col justify-between space-y-4 animate-in fade-in duration-150">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                        {activeRoomItem.room.name}
                      </h3>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {activeRoomItem.room.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {activeRoomItem.room.floorName} · {activeRoomItem.room.block}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                      activeRoomItem.status === 'BUSY'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : activeRoomItem.status === 'BUSY_SOON'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {activeRoomItem.status === 'BUSY'
                      ? 'Occupied'
                      : activeRoomItem.status === 'BUSY_SOON'
                      ? 'Kick-Out Soon'
                      : 'Available'}
                  </span>
                </div>

                {/* Requirement 2: Live Countdown Timer (HH:MM:SS) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    Live Availability Countdown:
                  </span>
                  <LiveCountdownTimer
                    roomStatus={activeRoomItem}
                    currentDay={currentDay}
                    currentTimeMinutes={currentTimeMinutes}
                    isSimulated={isSimulated}
                  />
                </div>

                {/* Requirement 3: "Call the Squad" WhatsApp Sharing */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Study Group Coordinator</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-medium">
                      WhatsApp Sync
                    </span>
                  </div>

                  {activeRoomItem.status !== 'BUSY' ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Coordinate study desks in <strong className="text-slate-900">{activeRoomItem.room.name}</strong> before scheduled SRM Trichy lectures resume.
                      </p>
                      <SquadShareButton
                        roomStatus={activeRoomItem}
                        currentDay={currentDay}
                        currentTimeMinutes={currentTimeMinutes}
                        isSimulated={isSimulated}
                        className="w-full py-2.5"
                        size="md"
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Squad invitations are disabled while this classroom is actively occupied by a scheduled lecture.
                    </p>
                  )}
                </div>

                {/* Dataset Specifications */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    SRM Trichy Venue Amenities:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Capacity: <strong className="text-slate-900">{activeRoomItem.room.capacity ? `${activeRoomItem.room.capacity} seats` : 'Not available'}</strong>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                      <Wind className={`w-3.5 h-3.5 shrink-0 ${activeRoomItem.room.amenities?.ac ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span className={activeRoomItem.room.amenities?.ac ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                        {activeRoomItem.room.amenities ? (activeRoomItem.room.amenities.ac ? 'Air Conditioned' : 'Non-AC') : 'Not available'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                      <Tv className={`w-3.5 h-3.5 shrink-0 ${activeRoomItem.room.amenities?.projector ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span className={activeRoomItem.room.amenities?.projector ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                        {activeRoomItem.room.amenities ? (activeRoomItem.room.amenities.projector ? 'HD Projector' : 'No Projector') : 'Not available'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                      <Monitor className={`w-3.5 h-3.5 shrink-0 ${activeRoomItem.room.amenities?.labComputers ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={activeRoomItem.room.amenities?.labComputers ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                        {activeRoomItem.room.amenities ? (activeRoomItem.room.amenities.labComputers ? 'Workstations' : 'Standard Class') : 'Not available'}
                      </span>
                    </div>
                  </div>

                  {/* Next Scheduled Class Card */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Next Scheduled Class:</span>
                    </div>
                    {activeRoomItem.nextClass && activeRoomItem.nextClassPeriod ? (
                      <div className="space-y-0.5 mt-1">
                        <div className="font-bold text-slate-900">
                          {activeRoomItem.nextClass.courseCode}: {activeRoomItem.nextClass.courseName}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Starts at <strong className="text-slate-900">{formatMinutesToTime(activeRoomItem.nextClassPeriod.startMinutes)}</strong> ({activeRoomItem.nextClassPeriod.name}) · Faculty: {activeRoomItem.nextClass.faculty || 'Not available'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        No upcoming class scheduled today
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {activeRoomItem.status !== 'BUSY' && !activeRoomItem.isClaimed ? (
                  <button
                    onClick={() => onClaimRoom(activeRoomItem.room.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Claim Room</span>
                  </button>
                ) : activeRoomItem.isClaimed ? (
                  <button
                    onClick={() => onReleaseClaim(activeRoomItem.room.id)}
                    className="px-3 py-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold hover:underline"
                  >
                    Release Claim
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">
                    Class in session
                  </span>
                )}

                <button
                  onClick={() => onOpenDetails(activeRoomItem.room.id)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                >
                  <span>Full Timetable</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex-1 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Select Any SRM Trichy Classroom in 3D
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Click any room block in the 3D map to view its second-by-second countdown timer, faculty timetable, or to send a WhatsApp invitation to your squad.
              </p>
              <div className="pt-2 text-xs font-mono text-slate-400 flex items-center gap-2">
                <span>Tip: Drag to rotate</span>
                <span>·</span>
                <span>Scroll to zoom</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
