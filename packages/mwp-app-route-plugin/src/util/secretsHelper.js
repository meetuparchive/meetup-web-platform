// @flow
import AWS from 'aws-sdk';

const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

export function fetchLaunchDarklySdkKey(): Promise<string> {
	console.warn('Calling fetchLaunchDarklySdkKey');
	return secretsManager
		.getSecretValue({ SecretId: 'LaunchDarkly-error' })
		.promise()
		.then(({ SecretString }) => JSON.parse(SecretString).apiAccessToken)
		.catch(error => {
			console.error(
				'The LaunchDarkly key may not have resolved properly.  Double check that it is in the SecretsManager, has a name of LaunchDarkly and a key of "apiAccessToken"'
			);
			throw error;
		});
}
