import ProviderFactory from "./providers/provider-factory";

export class MailNotifierService {
    private provider = ProviderFactory.getProvider();
    
    public async sendTestMail(email: string) {
        await this.provider.sendMail(email, "Envoie de mail test", 
            `<h1>Data Subvention</h1>
                <p>Ceci est un mail de test merci de ne pas en prendre compte.</p>

                <p>Bonne journée, de la part de l'équipe DataSubvention !</p>`
            , `
            Data Subvention
            Ceci est un mail de test merci de ne pas en prendre compte

            Bonne journée, de la part de l'équipe DataSubvention !
        `);
    }

    public async sendCreationMail(email: string, token: string) {
        await this.provider.sendMail(
            email,
            "Inscription à la plateforme DataSubvention",
            `<h1>Data Subvention</h1>
            <p>
                Félicitation, vous venez d'être inscrit à la plateforme DataSubvention !
            </p>
            <p>
                Pour acceder à celle-ci vous devez activer votre compte et choisir un mot de passe. Veuilliez vous rendre sur l'outil Postman en cliquant <a href="https://datasubvention.postman.co/workspace/Team-DataSubvention~064238d6-0f48-47f3-8f03-2f4312dbd702/request/9452502-6e7f4900-4f0d-4e36-b29d-aede3be4ff83">ici</a>.
                <br>Ajouter ceci dans le champ token: ${token}.
                <br>Et saisiser votre mots de passe dans le champs password.
            </p>

            <p>Bonne journée et à bientôt sur notre plateforme !</p>
            <p>L'équipe DataSubvention</p>
            `,
            `Data Subvention
            
            Félicitation, vous venez d'être inscrit à la plateforme DataSubvention !
            
            
            Pour acceder à celle-ci vous devez activer votre compte et choisir un mot de passe. Veuilliez vous rendre sur l'outil Postman en cliquant sur ce lien : https://datasubvention.postman.co/workspace/Team-DataSubvention~064238d6-0f48-47f3-8f03-2f4312dbd702/request/9452502-6e7f4900-4f0d-4e36-b29d-aede3be4ff83 .
            Ajouter ceci dans le champ token: ${token}. Et saisiser votre mots de passe dans le champs password.
            

            Bonne journée et à bientôt sur notre plateforme !
            L'équipe DataSubvention `
        )
    }

    public async sendForgetPassword(email: string, token: string) {
        await this.provider.sendMail(
            email,
            "Mots de passe perdu -- DataSubvention",
            `<h1>Data Subvention</h1>
            <p>
                Vous avez fait une demande de mots de passe perdu, sur la plateforme DataSubvention.
            </p>
            <p>
                Pour changer votre mots de passe, veuilliez vous rendre sur l'outil Postman en cliquant <a href="https://datasubvention.postman.co/workspace/Team-DataSubvention~064238d6-0f48-47f3-8f03-2f4312dbd702/request/9452502-6e7f4900-4f0d-4e36-b29d-aede3be4ff83">ici</a>.
                <br>Ajouter ceci dans le champ token: ${token}. <br>Et saisiser votre mots de passe dans le champs password.
            </p>
            
            <p>Bonne journée et à bientôt sur notre plateforme !</p>
            <p>L'équipe DataSubvention</p>
            `,
            `Data Subvention
            
            Vous avez fait une demande de mots de passe perdu, sur la plateforme DataSubvention.
            
            
            Pour changer votre mots de passe, veuilliez vous rendre sur l'outil Postman en cliquant sur ce lien : https://datasubvention.postman.co/workspace/Team-DataSubvention~064238d6-0f48-47f3-8f03-2f4312dbd702/request/9452502-6e7f4900-4f0d-4e36-b29d-aede3be4ff83 .
            Ajouter ceci dans le champ token: ${token}. Et saisiser votre mots de passe dans le champs password.
            

            Bonne journée et à bientôt sur notre plateforme !
            L'équipe DataSubvention 
            `,
        )
    }
}

const mailNotifierService = new MailNotifierService();

export default mailNotifierService;