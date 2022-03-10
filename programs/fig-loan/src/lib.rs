use anchor_lang::prelude::*;

declare_id!("3kQ3C1oA9YQLxscz6La5ZXNXHW1KbUfqgASXPuCpXUYv");

pub const CORE_STATE_SEED: &str = "core-state";
pub const FIG_ACCOUNT_SEED: &str = "fig-account";

#[program]
pub mod fig_loan {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> ProgramResult {
        ctx.accounts.core_state.admin = ctx.accounts.admin.key();
        ctx.accounts.core_state.core_state_nonce = args.core_state_nonce;
        Ok(())
    }

    pub fn register(ctx: Context<Register>, args: RegisterArgs) -> ProgramResult {
        ctx.accounts.fig_account.user = ctx.accounts.user.key();
        ctx.accounts.fig_account.fig_account_nonce = args.fig_account_nonce;
        ctx.accounts.fig_account.available_amount = 0;
        ctx.accounts.fig_account.collateral_amount = 0;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(args: InitializeArgs)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        seeds = [CORE_STATE_SEED.as_bytes().as_ref(), admin.key().as_ref()],
        bump = args.core_state_nonce,
        payer = admin,
    )]
    pub core_state: Account<'info, CoreState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: RegisterArgs)]
pub struct Register<'info> {
    #[account(
        mut,
        seeds = [CORE_STATE_SEED.as_bytes().as_ref(), admin.key().as_ref()],
        bump = args.core_state_nonce,
    )]
    pub core_state: Account<'info, CoreState>,
    #[account(
        mut,
        constraint = admin.key() == core_state.admin @ ErrorCode::WrongAdmin,
    )]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub user: AccountInfo<'info>,
    #[account(
        init,
        seeds = [FIG_ACCOUNT_SEED.as_bytes().as_ref(), user.key().as_ref()],
        bump = args.fig_account_nonce,
        payer = admin,
    )]
    pub fig_account: Account<'info, FigAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeArgs {
    pub core_state_nonce: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RegisterArgs {
    pub core_state_nonce: u8,
    pub fig_account_nonce: u8,
}

#[account]
#[derive(Default)]
pub struct CoreState {
    pub core_state_nonce: u8,
    pub admin: Pubkey, // admin public key
}

#[account]
#[derive(Default)]
pub struct FigAccount {
    pub user: Pubkey, // user public key
    pub fig_account_nonce: u8,
    pub available_amount: u32,
    pub collateral_amount: u32,
}

#[error]
pub enum ErrorCode {
    #[msg("Wrong Admin Address")]
    WrongAdmin,
}
