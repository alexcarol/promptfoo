"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCommand = authCommand;
const chalk_1 = __importDefault(require("chalk"));
const dedent_1 = __importDefault(require("dedent"));
const envars_1 = require("../envars");
const accounts_1 = require("../globalConfig/accounts");
const cloud_1 = require("../globalConfig/cloud");
const logger_1 = __importDefault(require("../logger"));
const telemetry_1 = __importDefault(require("../telemetry"));
const cloud_2 = require("../util/cloud");
const index_1 = require("../util/fetch/index");
const server_1 = require("../util/server");
function authCommand(program) {
    const authCommand = program.command('auth').description('Manage authentication');
    authCommand
        .command('login')
        .description('Login')
        .option('-o, --org <orgId>', 'The organization id to login to.')
        .option('-h,--host <host>', 'The host of the promptfoo instance. This needs to be the url of the API if different from the app url.')
        .option('-k, --api-key <apiKey>', 'Login using an API key.')
        .action(async (cmdObj) => {
        let token;
        const apiHost = cmdObj.host || cloud_1.cloudConfig.getApiHost();
        telemetry_1.default.record('command_used', {
            name: 'auth login',
        });
        try {
            if (cmdObj.apiKey) {
                token = cmdObj.apiKey;
                const { user, organization } = await cloud_1.cloudConfig.validateAndSetApiToken(token, apiHost);
                // Store token in global config and handle email sync
                const existingEmail = (0, accounts_1.getUserEmail)();
                if (existingEmail && existingEmail !== user.email) {
                    logger_1.default.info(chalk_1.default.yellow(`Updating local email configuration from ${existingEmail} to ${user.email}`));
                }
                (0, accounts_1.setUserEmail)(user.email);
                // Set current organization context
                cloud_1.cloudConfig.setCurrentOrganization(organization.id);
                // Display login success with user/org info
                logger_1.default.info(chalk_1.default.green.bold('Successfully logged in'));
                logger_1.default.info(`User: ${chalk_1.default.cyan(user.email)}`);
                logger_1.default.info(`Organization: ${chalk_1.default.cyan(organization.name)}`);
                logger_1.default.info(`App: ${chalk_1.default.cyan(cloud_1.cloudConfig.getAppUrl())}`);
                // Set up default team (only if no team is already selected for this org)
                try {
                    const allTeams = await (0, cloud_2.getUserTeams)();
                    cloud_1.cloudConfig.cacheTeams(allTeams, organization.id);
                    const existingTeamId = cloud_1.cloudConfig.getCurrentTeamId(organization.id);
                    if (existingTeamId) {
                        // Team already selected, keep it
                        try {
                            const currentTeam = await (0, cloud_2.getTeamById)(existingTeamId);
                            logger_1.default.info(`Team: ${chalk_1.default.cyan(currentTeam.name)}`);
                        }
                        catch (_error) {
                            // Stored team no longer valid, fall back to default
                            const defaultTeam = await (0, cloud_2.getDefaultTeam)();
                            cloud_1.cloudConfig.setCurrentTeamId(defaultTeam.id, organization.id);
                            logger_1.default.info(`Team: ${chalk_1.default.cyan(defaultTeam.name)} ${chalk_1.default.dim('(default)')}`);
                        }
                    }
                    else {
                        // No team selected yet, set the default
                        const defaultTeam = await (0, cloud_2.getDefaultTeam)();
                        cloud_1.cloudConfig.setCurrentTeamId(defaultTeam.id, organization.id);
                        logger_1.default.info(`Team: ${chalk_1.default.cyan(defaultTeam.name)} ${chalk_1.default.dim('(default)')}`);
                        if (allTeams.length > 1) {
                            logger_1.default.info(chalk_1.default.dim(`Use 'promptfoo auth teams list' to see all teams`));
                            logger_1.default.info(chalk_1.default.dim(`Use 'promptfoo auth teams set <name>' to switch teams`));
                        }
                    }
                }
                catch (teamError) {
                    logger_1.default.warn(`Could not set up team context: ${teamError instanceof Error ? teamError.message : String(teamError)}`);
                }
                return;
            }
            else {
                // Use host parameter if provided, otherwise use stored app URL
                const appUrl = cmdObj.host || cloud_1.cloudConfig.getAppUrl();
                const authUrl = new URL(appUrl);
                const welcomeUrl = new URL('/welcome', appUrl);
                if ((0, envars_1.isNonInteractive)()) {
                    // CI Environment or non-interactive: Exit with error but show manual URLs
                    logger_1.default.error('Authentication required. Please set PROMPTFOO_API_KEY environment variable or run `promptfoo auth login` in an interactive environment.');
                    logger_1.default.info(`Manual login URL: ${chalk_1.default.green(authUrl.toString())}`);
                    logger_1.default.info(`After login, get your API token at: ${chalk_1.default.green(welcomeUrl.toString())}`);
                    process.exitCode = 1;
                    return;
                }
                // Interactive Environment: Offer to open browser
                await (0, server_1.openAuthBrowser)(authUrl.toString(), welcomeUrl.toString(), server_1.BrowserBehavior.ASK);
                return;
            }
            return;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`Authentication failed: ${errorMessage}`);
            process.exitCode = 1;
            return;
        }
    });
    authCommand
        .command('logout')
        .description('Logout')
        .action(async () => {
        const email = (0, accounts_1.getUserEmail)();
        const apiKey = cloud_1.cloudConfig.getApiKey();
        if (!email && !apiKey) {
            logger_1.default.info(chalk_1.default.yellow("You're already logged out - no active session to terminate"));
            return;
        }
        await cloud_1.cloudConfig.delete();
        // Always unset email on logout
        (0, accounts_1.setUserEmail)('');
        logger_1.default.info(chalk_1.default.green('Successfully logged out'));
        return;
    });
    authCommand
        .command('whoami')
        .description('Show current user information')
        .action(async () => {
        try {
            const email = (0, accounts_1.getUserEmail)();
            const apiKey = cloud_1.cloudConfig.getApiKey();
            if (!email || !apiKey) {
                logger_1.default.info(`Not logged in. Run ${chalk_1.default.bold('promptfoo auth login')} to login.`);
                return;
            }
            const apiHost = cloud_1.cloudConfig.getApiHost();
            const response = await (0, index_1.fetchWithProxy)(`${apiHost}/api/v1/users/me`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user info: ' + response.statusText);
            }
            const { user, organization } = await response.json();
            try {
                const currentTeam = await (0, cloud_2.resolveTeamId)();
                logger_1.default.info((0, dedent_1.default) `
              ${chalk_1.default.green.bold('Currently logged in as:')}
              User: ${chalk_1.default.cyan(user.email)}
              Organization: ${chalk_1.default.cyan(organization.name)}
              Current Team: ${chalk_1.default.cyan(currentTeam.name)}
              App URL: ${chalk_1.default.cyan(cloud_1.cloudConfig.getAppUrl())}`);
            }
            catch (teamError) {
                logger_1.default.info((0, dedent_1.default) `
              ${chalk_1.default.green.bold('Currently logged in as:')}
              User: ${chalk_1.default.cyan(user.email)}
              Organization: ${chalk_1.default.cyan(organization.name)}
              App URL: ${chalk_1.default.cyan(cloud_1.cloudConfig.getAppUrl())}`);
                logger_1.default.warn(`Could not determine current team: ${teamError instanceof Error ? teamError.message : String(teamError)}`);
            }
            telemetry_1.default.record('command_used', {
                name: 'auth whoami',
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`Failed to get user info: ${errorMessage}`);
            process.exitCode = 1;
        }
    });
    authCommand
        .command('can-create-targets')
        .description('Check if user can create targets')
        .option('-t, --team-id <teamId>', 'The team id to check permissions for')
        .action(async (cmdObj) => {
        try {
            if (!cloud_1.cloudConfig.isEnabled()) {
                logger_1.default.info(chalk_1.default.yellow('PromptFoo Cloud is not enabled, run `promptfoo auth login` to enable it'));
                return;
            }
            if (cmdObj.teamId) {
                const canCreate = await (0, cloud_2.canCreateTargets)(cmdObj.teamId);
                logger_1.default.info(chalk_1.default.green(`Can create targets for team ${cmdObj.teamId}: ${canCreate}`));
            }
            else {
                const team = await (0, cloud_2.resolveTeamId)();
                const canCreate = await (0, cloud_2.canCreateTargets)(team.id);
                logger_1.default.info(chalk_1.default.green(`Can create targets for team ${team.name}: ${canCreate}`));
            }
            telemetry_1.default.record('command_used', {
                name: 'auth can-create-targets',
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`Failed to check if user can create targets: ${errorMessage}`);
            process.exitCode = 1;
        }
    });
    // Teams management subcommands
    const teamsCommand = authCommand.command('teams').description('Manage team settings');
    teamsCommand
        .command('list')
        .description('List available teams')
        .action(async () => {
        try {
            if (!cloud_1.cloudConfig.isEnabled()) {
                logger_1.default.info(chalk_1.default.yellow('PromptFoo Cloud is not enabled, run `promptfoo auth login` to enable it'));
                return;
            }
            const teams = await (0, cloud_2.getUserTeams)();
            const currentOrganizationId = cloud_1.cloudConfig.getCurrentOrganizationId();
            const currentTeamId = cloud_1.cloudConfig.getCurrentTeamId(currentOrganizationId);
            if (teams.length === 0) {
                logger_1.default.info('No teams found');
                return;
            }
            logger_1.default.info(chalk_1.default.green.bold('Available teams:'));
            teams.forEach((team) => {
                const isCurrent = team.id === currentTeamId;
                const marker = isCurrent ? chalk_1.default.green('●') : ' ';
                const nameColor = isCurrent ? chalk_1.default.green.bold : chalk_1.default.white;
                logger_1.default.info(`${marker} ${nameColor(team.name)} ${chalk_1.default.dim(`(${team.slug})`)}`);
            });
            if (currentTeamId) {
                const currentTeam = teams.find((t) => t.id === currentTeamId);
                if (currentTeam) {
                    logger_1.default.info(`\nCurrent team: ${chalk_1.default.green(currentTeam.name)}`);
                }
            }
            telemetry_1.default.record('command_used', {
                name: 'auth teams list',
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`Failed to list teams: ${errorMessage}`);
            process.exitCode = 1;
        }
    });
    teamsCommand
        .command('current')
        .description('Show current team')
        .action(async () => {
        try {
            if (!cloud_1.cloudConfig.isEnabled()) {
                logger_1.default.info(chalk_1.default.yellow('PromptFoo Cloud is not enabled, run `promptfoo auth login` to enable it'));
                return;
            }
            const currentOrganizationId = cloud_1.cloudConfig.getCurrentOrganizationId();
            const currentTeamId = cloud_1.cloudConfig.getCurrentTeamId(currentOrganizationId);
            if (!currentTeamId) {
                logger_1.default.info('No team currently selected');
                return;
            }
            try {
                const team = await (0, cloud_2.resolveTeamId)();
                logger_1.default.info(`Current team: ${chalk_1.default.green(team.name)}`);
            }
            catch (_error) {
                logger_1.default.warn('Stored team is no longer accessible, falling back to default');
                const team = await (0, cloud_2.resolveTeamId)();
                logger_1.default.info(`Current team: ${chalk_1.default.green(team.name)} ${chalk_1.default.dim('(default)')}`);
            }
            telemetry_1.default.record('command_used', {
                name: 'auth teams current',
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`Failed to get current team: ${errorMessage}`);
            process.exitCode = 1;
        }
    });
    teamsCommand
        .command('set')
        .description('Set current team')
        .argument('<team>', 'Team name, slug, or ID')
        .action(async (teamIdentifier) => {
        try {
            if (!cloud_1.cloudConfig.isEnabled()) {
                logger_1.default.info(chalk_1.default.yellow('PromptFoo Cloud is not enabled, run `promptfoo auth login` to enable it'));
                return;
            }
            const team = await (0, cloud_2.resolveTeamFromIdentifier)(teamIdentifier);
            cloud_1.cloudConfig.setCurrentTeamId(team.id, team.organizationId);
            logger_1.default.info(chalk_1.default.green(`Switched to team: ${team.name}`));
            telemetry_1.default.record('command_used', {
                name: 'auth teams set',
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`Failed to set team: ${errorMessage}`);
            process.exitCode = 1;
        }
    });
}
//# sourceMappingURL=auth.js.map