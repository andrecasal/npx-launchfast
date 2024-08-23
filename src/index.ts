#!/usr/bin/env node

import { execSync } from 'child_process'
import {
	intro,
	spinner,
	confirm,
	isCancel,
	select,
	password,
	cancel,
	text,
	outro,
} from '@clack/prompts'
import { note } from './ui'
import open from 'open'

type Context = {
	steps: {
		current: number
		total: number
	}
	progress: string
	privateAccessToken: string
	folderName: string
	packageManager: string
	packageManagers: { label: string; value: string }[]
}

const ctx: Context = {
	steps: {
		current: 0,
		total: 0,
	},
	progress: '',
	privateAccessToken: '',
	folderName: '',
	packageManager: '',
	packageManagers: [],
}

async function main() {
	const steps = createSteps()

	try {
		for (let step of steps) {
			progressIndicator(ctx)
			await step(ctx)
			ctx.steps.current++
		}
	} catch (err) {
		/* if (ctx.debug) {
			console.error(err)
		} */
		throw err
	}

	const command = `npx --yes create-remix@latest ${ctx.folderName} --package-manager ${ctx.packageManager} --git-init --install --init-script --template andrecasal/launch-fast-stack --token ${ctx.privateAccessToken}`
	try {
		execSync(command, { stdio: 'inherit' })
	} catch (error) {
		//console.error('Failed to execute command:', error.message)
		console.error('Error details:', error)
	}
}

const createSteps = () => {
	const steps = []
	steps.push(introStep)
	steps.push(createPATStep)
	steps.push(getPATStep)
	steps.push(checkAccessStep)
	steps.push(createFolderStep)
	const hasPackageManagerChoice = needToChoosePackageManager()
	if (hasPackageManagerChoice) {
		steps.push(packageManagerQuestionStep)
	}
	steps.push(outroStep)

	ctx.steps.total = steps.length - 2

	return steps
}

const needToChoosePackageManager = () => {
	const packageManagers: { label: string; value: string }[] = []
	try {
		execSync(`npm --version`, { stdio: `ignore` })
		packageManagers.push({ label: `npm`, value: `npm` })
	} catch {}

	try {
		execSync(`yarn --version`, { stdio: `ignore` })
		packageManagers.push({ label: `yarn`, value: `yarn` })
	} catch {}

	try {
		execSync(`pnpm --version`, { stdio: `ignore` })
		packageManagers.push({ label: `pnpm`, value: `pnpm` })
	} catch {}

	if (packageManagers.length === 0) {
		console.error(
			`No package managers found. Please install npm, yarn, or pnpm.`,
		)
		return process.exit(1)
	}

	if (packageManagers.length === 1) {
		ctx.packageManager = packageManagers[0].value
		return false
	}

	ctx.packageManagers = packageManagers

	return true
}

const progressIndicator = (ctx: Context) => {
	ctx.progress = `Step ${ctx.steps.current}/${ctx.steps.total}: `
}

const introStep = async () => {
	console.log()
	intro(`Welcome to LaunchFast.pro 🚀`)
}

const createPATStep = async (ctx: Context) => {
	const shouldCreateNewToken = await confirm({
		message: `${ctx.progress}We need a Private Access Token (PAT) to download the template. Open GitHub to create one (use the default read-only scope, scroll down and press "Generate token")?`,
		active: `Yes, open GitHub`,
		inactive: `No, I already have a PAT`,
	})
	if (isCancel(shouldCreateNewToken)) {
		cancel('Operation cancelled')
		return process.exit(0)
	}
	if (shouldCreateNewToken) {
		await open(
			`https://github.com/settings/tokens/new?description=LaunchFast%20Private%20Access&scopes=repo`,
		)
	}
}

const getPATStep = async (ctx: Context) => {
	const privateAccessToken = await password({
		message: `${ctx.progress}Paste your GitHub PAT:`,
		mask: '*',
		validate(value) {
			if (value.length === 0) return `A token is required!`
			if (!value.startsWith('ghp_'))
				return `Invalid token! It starts with "ghp_"`
		},
	})
	if (isCancel(privateAccessToken)) {
		cancel('Operation cancelled')
		return process.exit(0)
	}
	ctx.privateAccessToken = privateAccessToken
}

const checkAccessStep = async (ctx: Context) => {
	const s = spinner()
	s.start(`${ctx.progress}Checking access to the private repo...`)
	const url =
		'https://api.github.com/repos/andrecasal/launch-fast-stack/tarball'
	const response = await fetch(url, {
		method: 'HEAD',
		headers: {
			Authorization: `token ${ctx.privateAccessToken}`,
		},
	})
	const userHasAccess = response.status === 302 || response.status === 200

	if (!userHasAccess) {
		s.stop(`🔴 Access denied!`)
		note(
			`1. You've purchased LaunchFast.pro
2. Accepted the invitation to LaunchFast's private repo`,
			`Make sure that:`,
		)
		outro(`If you didn't receive an invitation, please contact support.`)
		console.log()
		return process.exit(0)
	}
	s.stop(`${ctx.progress}🟢 Access granted!`)
}

const createFolderStep = async (ctx: Context) => {
	const folderName = await text({
		message: `${ctx.progress}Let's create a folder for your new project. What should we call it?`,
		placeholder: `./my-new-project`,
		validate(value) {
			if (value.length === 0) return `A folder name is required!`
		},
	})
	if (isCancel(folderName)) {
		cancel('Operation cancelled')
		return process.exit(0)
	}
	ctx.folderName = folderName
}

const packageManagerQuestionStep = async (ctx: Context) => {
	const packageManager: symbol | string = await select({
		message: `${ctx.progress}Select the package manager you'd like to use:`,
		options: ctx.packageManagers,
	})

	if (isCancel(packageManager)) {
		cancel(`Operation cancelled`)
		return process.exit(0)
	}
	ctx.packageManager = packageManager
}

const outroStep = async () => {
	outro(`Let's create your new project 🚀`)
}

main().catch(console.error)
