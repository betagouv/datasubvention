import { valueOrHyphen, numberToEuro } from "$lib/helpers/dataHelper";
import { capitalizeFirstLetter } from "$lib/helpers/stringHelper";
import { mapSiretPostCodeStore } from "$lib/store/association.store";

export default class SubventionsAdapter {
    /**
     * @param {siret, subvention, versements} element Object that links an application to its related payments
     */
    static toSubvention(element) {
        const siret = element.siret?.toString();
        const subvention = element.subvention;
        let dispositif = subvention.dispositif;
        let serviceInstructeur = subvention.service_instructeur;
        let projectName = this._getProjectName(subvention);

        return {
            establishmentPostcode: valueOrHyphen(
                mapSiretPostCodeStore.value.get(siret)?.replace(/(\d{2})(\d{3})/, "$1 $2"),
            ),
            serviceInstructeur: valueOrHyphen(serviceInstructeur),
            dispositif: valueOrHyphen(dispositif),
            projectName: valueOrHyphen(projectName),
            montantsDemande: valueOrHyphen(numberToEuro(subvention.montants?.demande)),
            montantsAccorde: numberToEuro(subvention.montants?.accorde),
            status: subvention.statut_label,
        };
    }

    static _getProjectName(subvention) {
        if (!subvention.actions_proposee || !subvention.actions_proposee.length) return;

        let names = subvention.actions_proposee
            .sort((actionA, actionB) => actionA.rang - actionB.rang)
            .map(action => `${capitalizeFirstLetter(action.intitule)}.`.replace("..", "."));

        names = [...new Set(names)].join(" - ");

        return names;
    }
}
