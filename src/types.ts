// types.ts
export interface AnimalStats {
    vaccine?: number;
    maleSterilize?: number;
    femaleSterilize?: number;
    microchip?: number;
    register?: number;
    medical?: number;
}

export interface ItemDetails {
    vaccineRequisitioned?: number;
    vaccineRemaining?: number;
    dog?: AnimalStats;
    cat?: AnimalStats;
    other?: AnimalStats;
}

export interface ItemStats {
    vaccine?: number;
    sterilize?: number;
    register?: number;
    microchip?: number;
    medical?: number;
}

export interface DataItem {
    _id: string;
    date: string;
    unit?: string;
    location: string;
    district: string;
    lat?: number | string;
    long?: number | string;
    imageUrl?: string | null;
    stats?: ItemStats;
    details?: ItemDetails; 
    createdBy?: string;
    updatedBy?: string;
}