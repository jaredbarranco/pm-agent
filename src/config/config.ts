export interface AppConfig {
	pg: {
		host: string;
		port: string;
		username: string;
		password: string;
		connectionString: string;
	};
	openAi: {
		key: string;
	};
}

export const config: AppConfig = {
	pg: {
		host: process.env.POSTGRES_HOST || '',
		port: process.env.POSTGRES_PORT || '5432',
		username: process.env.POSTGRES_USER || '',
		password: process.env.POSTGRES_PASS || '',
		connectionString: process.env.POSTGRES_CONNECTION_STRING ||
			`postgresql://${process.env.POSTGRES_USER}:${process.env.PG_PASS}@${process.env.PG_HOST}:${process.env.PG_PORT}`
	},
	openAi: {
		key: process.env.OPEN_API_KEY || ''
	}
};
