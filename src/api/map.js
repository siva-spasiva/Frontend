import { apiClient } from './client';

export const fetchAllMaps = async () => {
    return apiClient('/api/v1/map/', { auth: true });
};

export const fetchFloor = async (floorId) => {
    return apiClient(`/api/v1/map/${encodeURIComponent(floorId)}`, {
        auth: true,
    });
};

export const fetchRoom = async (floorId, roomId) => {
    return apiClient(`/api/v1/map/${encodeURIComponent(floorId)}/room/${encodeURIComponent(roomId)}`, {
        auth: true,
    });
};
