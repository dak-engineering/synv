import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/types'
import type { Rule } from 'eslint'

export const noAnyExceptInGenerics: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow `any` except when used inside generics (type arguments or type parameter defaults/constraints).',
		},
		messages: {
			noAny:
				'Unexpected `any`. Only allowed inside generics (e.g., `Foo<any>`, `<T = any>`, or `<T extends any>`).',
		},
		schema: [],
	},
	create(context) {
		function isAllowedGenericContext(node: TSESTree.TSAnyKeyword): boolean {
			let cur = node.parent as TSESTree.Node | undefined

			while (cur) {
				const nodeType = cur.type

				// Allowed when `any` is used as a generic type argument: Foo<any>
				if (nodeType === AST_NODE_TYPES.TSTypeParameterInstantiation) return true

				// Allowed inside a generic type parameter declaration
				// e.g. function f<T = any>() or interface X<T extends any> {}
				if (nodeType === AST_NODE_TYPES.TSTypeParameter) return true

				// Stop climbing once we exit the type position where "generic-ness" would be relevant
				// If we hit a function decl, variable decl, or top-level program without finding an allowed ancestor, bail.
				if (
					nodeType === AST_NODE_TYPES.Program
					|| nodeType === AST_NODE_TYPES.VariableDeclarator
					|| nodeType === AST_NODE_TYPES.TSTypeAnnotation
					|| nodeType === AST_NODE_TYPES.FunctionDeclaration
					|| nodeType === AST_NODE_TYPES.ArrowFunctionExpression
					|| nodeType === AST_NODE_TYPES.FunctionExpression
				) {
					break
				}

				cur = cur.parent
			}

			return false
		}

		return {
			TSAnyKeyword(node) {
				if (!isAllowedGenericContext(node)) {
					context.report({ node, messageId: 'noAny' })
				}
			},
		}
	},
}
