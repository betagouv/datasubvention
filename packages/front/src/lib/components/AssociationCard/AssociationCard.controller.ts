import { getFirstPartAddress, getLastPartAddress } from "$lib/resources/associations/association.helper";

export default class AssociationCardController {
    constructor(public simplifiedAsso, public searchKey: string | undefined) {}

    get url() {
        const identifier =
            this.searchKey === this.simplifiedAsso.rna
                ? this.simplifiedAsso.siren
                : this.searchKey === this.simplifiedAsso.siren
                ? this.simplifiedAsso.rna
                : this.simplifiedAsso.rna || this.simplifiedAsso.siren;

        return `/association/${identifier}`;
    }

    get street() {
        return getFirstPartAddress(this.simplifiedAsso.address);
    }

    get city() {
        return getLastPartAddress(this.simplifiedAsso.address);
    }

    get nbEtabsLabel() {
        return this.simplifiedAsso.nbEtabs == 1
            ? `${this.simplifiedAsso.nbEtabs} établissement rattaché`
            : this.simplifiedAsso.nbEtabs < 1
            ? "aucun établissement rattaché"
            : `${this.simplifiedAsso.nbEtabs} établissements rattachés`;
    }
}
