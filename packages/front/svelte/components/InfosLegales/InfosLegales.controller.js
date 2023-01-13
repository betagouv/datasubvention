import { valueOrHyphen } from "../../helpers/dataHelper";
import {
    addressToString,
    getAddress,
    getImmatriculation,
    getModification,
    getSiegeSiret
} from "../../views/association/association.helper";
import { modal, data } from "../../store/modal.store";
import MoreInfosLegalesModal from "./MoreInfosLegalesModal.svelte";
import { MMDDYYYDate } from "../../helpers/dateHelper";

export default class InfosLegalesController {
    constructor(association, etablissement = undefined) {
        this.association = { ...association };
        this.etablissement = etablissement ? { ...etablissement } : undefined;
        this._immatriculation = getImmatriculation(this.association);
        this._modification = getModification(this.association);
        this._modalData = this._buildModalData();
    }

    get siret() {
        let title, value;
        if (this.etablissement) {
            title = "SIRET établissement";
            value = this.etablissement.siret;
        } else {
            title = "SIRET du siège";
            value = getSiegeSiret(this.association);
        }
        return { title, value };
    }

    get address() {
        let title, value;
        if (this.etablissement) {
            title = "Adresse établissement";
            value = addressToString(this.etablissement.adresse);
        } else {
            title = "Adresse du siège";
            value = getAddress(this.association);
        }
        return { title, value };
    }

    get immatriculation() {
        return MMDDYYYDate(this._immatriculation);
    }

    get modification() {
        return MMDDYYYDate(this._modification);
    }

    displayModal() {
        data.set(this._modalData);
        modal.set(MoreInfosLegalesModal);
    }

    _buildModalData() {
        const headers = ["Titre", "Informations provenant du RNA", "Informations provenant du SIREN"];
        const objectRows = {
            Dénomination: [this.association.denomination_rna, this.association.denomination_siren],
            "Adresse du siège": [
                addressToString(this.association.adresse_siege_rna),
                addressToString(this.association.adresse_siege_siren)
            ],
            "Date d'immatriculation": [this.association.date_creation_rna, this.association.date_creation_siren],
            "Date de modification": [this.association.date_modification_rna, this.association.date_modification_siren]
        };
        const rows = Object.entries(objectRows).map(([header, values]) => {
            return [header, ...values.map(value => valueOrHyphen(value))];
        });
        return {
            headers,
            rows
        };
    }
}
