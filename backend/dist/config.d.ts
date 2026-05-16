export declare const config: {
    readonly port: number;
    readonly supabase: {
        readonly url: string;
        readonly serviceRoleKey: string;
    };
    readonly clerk: {
        readonly secretKey: string;
    };
    readonly ml: {
        readonly serviceUrl: string;
    };
    readonly mqtt: {
        readonly brokerUrl: string;
        readonly topic: string;
    };
    readonly alerts: {
        readonly leakThreshold: number;
        readonly severityThreshold: number;
    };
    readonly nodeEnv: string;
};
//# sourceMappingURL=config.d.ts.map