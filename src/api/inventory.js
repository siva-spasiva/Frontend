import { apiClient } from './client';

export const fetchInventory = async () => {
    return apiClient('/api/v1/inventory', { auth: true });
};

export const addItemAPI = async (itemId) => {
    return apiClient('/api/v1/inventory/add', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ item_id: itemId }),
    });
};

export const useItemAPI = async (itemId) => {
    return apiClient('/api/v1/inventory/use', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ item_id: itemId }),
    });
};

export const exploreZone = async (floorId, roomId, activeZoneId) => {
    return apiClient('/api/v1/inventory/explore', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
            floor_id: floorId,
            room_id: roomId,
            active_zone_id: activeZoneId,
        }),
    });
};
