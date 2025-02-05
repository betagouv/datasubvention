<script lang="ts">
    import { SearchCodeError } from "dto";
    import TabsAsso from "./components/TabsAsso.svelte";
    import { AssociationController } from "./Association.controller";
    import DuplicateAlert from "./components/DuplicateAlert.svelte";
    import Alert from "$lib/dsfr/Alert.svelte";
    import ErrorAlert from "$lib/components/ErrorAlert.svelte";
    import InfosLegales from "$lib/components/InfosLegales/InfosLegales.svelte";
    import DataNotFound from "$lib/components/DataNotFound.svelte";
    import FullPageSpinner from "$lib/components/FullPageSpinner.svelte";
    import StructureTitle from "$lib/components/StructureTitle/StructureTitle.svelte";

    export let data;
    const { identifier } = data.params;

    const controller = new AssociationController(identifier);
    const { associationPromise, duplicatesFromRna, duplicatesFromSiren, titles } = controller;
</script>

{#await associationPromise}
    <FullPageSpinner description="Chargement de l'association {identifier} en cours ..." />
{:then association}
    {#if $duplicatesFromRna}
        <div class="fr-mb-3w">
            <DuplicateAlert duplicates={$duplicatesFromRna} />
        </div>
    {/if}
    {#if $duplicatesFromSiren}
        <div class="fr-mb-3w">
            <DuplicateAlert duplicates={$duplicatesFromSiren} />
        </div>
    {/if}
    <div class="fr-mb-3w">
        <StructureTitle />
    </div>
    <div class="fr-mb-6w">
        <InfosLegales {association} />
    </div>
    <div class="fr-mb-6w">
        <TabsAsso {titles} associationIdentifier={identifier} />
    </div>
{:catch error}
    {#if error.httpCode === 404}
        <DataNotFound />
    {:else if error.httpCode === 400 && error?.data?.code === SearchCodeError.ID_NOT_ASSO}
        <div class="fr-mb-3w">
            <Alert type="warning" title="Attention">
                Il semblerait que vous cherchiez une entreprise et non une association
            </Alert>
        </div>
    {:else}
        <ErrorAlert message={error.message} />
    {/if}
{/await}
