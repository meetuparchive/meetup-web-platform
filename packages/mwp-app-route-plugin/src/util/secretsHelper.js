// @flow
import AWS from 'aws-sdk';

const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

export function fetchLaunchDarklySdkKey(): Promise<string> {
	return secretsManager
		.getSecretValue({ SecretId: 'LaunchDarkly' })
		.promise()
		.then(({ SecretString }) => {
			return SecretString === undefined
				? ''
				: JSON.parse(SecretString).apiAccessToken;
		});
}
