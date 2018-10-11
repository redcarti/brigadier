// Type definitions for brigadier[0.0.1]
// Project: Brigadier
// Definitions by: Remtori <https://github.com/Remtori>

import CommandContext from "./lib/context/CommandContext";

declare interface Command<S> {
    (context: CommandContext<S>): number;
}
declare interface SingleRedirectModifier<S> {
    apply(context: CommandContext<S>): S;
}
declare interface RedirectModifier<S> {
	apply(context: CommandContext<S>): S[];
}
declare interface Predicate<T> {
	(t: T): boolean;
}
declare interface AmbiguityConsumer<S> {
	ambiguous(parent: CommandNode<S>, child: CommandNode<S>, sibling: CommandNode<S>, inputs: Iterable<string>): void;
}
declare interface ImmutableStringReader {
	getString(): string;
	getRemainingLength(): number;
	getTotalLength(): number;
	getCursor(): number;
	getRead(): string;
	getRemaining(): string;
	canRead(length: number): boolean;
	canRead(): boolean;
	peek(): string;
	peek(offset: number): string;
}
declare interface Message {
    getString(): string;
}
declare interface CommandExceptionType {
}
declare interface ArgumentType<T> {
	parse(reader: StringReader): T;
	listSuggestions(context: CommandContext<any>, builder: SuggestionsBuilder): Promise<Suggestions>;
	getExamples(): Iterable<string>;
}
declare interface SuggestionProvider<S> {
    getSuggestions(context: CommandContext<S>, builder: SuggestionsBuilder): Promise<Suggestions>;
}
declare abstract class ArgumentBuilder<S, T extends ArgumentBuilder<S, T>> {
	abstract getThis(): T;
	then(arg: ArgumentBuilder<S, any> | CommandNode<S>): T;
	getArguments(): Iterable<CommandNode<S>>;
	executes(command: Command<S>): T;
	getCommand(): Command<S>;
	requires(requirement: Predicate<S>): T;
	getRequirement(): Predicate<S>;
	redirect(target: CommandNode<S>, modifier?: SingleRedirectModifier<S>): T;
	fork(target: CommandNode<S>, modifier: RedirectModifier<S>): T;
	forward(target: CommandNode<S>, modifier: RedirectModifier<S>, fork: boolean): T;
	getRedirect(): CommandNode<S>;
	getRedirectModifier(): RedirectModifier<S>;
	isFork(): boolean;
	abstract build(): CommandNode<S>;
}
declare abstract class CommandNode<S> {	    	    
	constructor(command: Command<S>, requirement: Predicate<S>, redirect: CommandNode<S>, modifier: RedirectModifier<S>, forks: boolean);
	abstract getNodeType(): string;
	getCommand(): Command<S>;
	getChildren(): Iterable<CommandNode<S>>;
	getChildrenCount(): number;
	getChild(name: string): CommandNode<S>;
	getRedirect(): CommandNode<S>;
	getRedirectModifier(): RedirectModifier<S>;
	canUse(source: S): boolean;
	addChild(node: CommandNode<S>): void;
	findAmbiguities(consumer: AmbiguityConsumer<S>): void;
	abstract isValidInput(input: string): boolean;
	equals(o: any): boolean;
	getRequirement(): Predicate<S>;
	abstract getName(): string;
	abstract getUsageText(): string;
	abstract parse(reader: StringReader, contextBuilder: CommandContextBuilder<S>): void;
	abstract listSuggestions(context: CommandContext<S>, builder: SuggestionsBuilder): Promise<Suggestions>;
	abstract createBuilder(): ArgumentBuilder<S, any>;
	abstract getSortedKey(): string;
	getRelevantNodes(input: StringReader): Iterable<CommandNode<S>>;
	compareTo(o: CommandNode<S>): number;
	isFork(): boolean;
	abstract getExamples(): Iterable<string>;
}
export declare function literal<S>(name: string): LiteralArgumentBuilder<S>;
export function bool(): BoolArgumentType;
export function integer(min?: number, max?: number): IntegerArgumentType;
export function float(min?: number, max?: number): FloatArgumentType;
export declare function word(): StringArgumentType;
export declare function string(): StringArgumentType;
export declare function greedyString(): StringArgumentType;
export declare function argument<S, T>(name: string, type: ArgumentType<T>): RequiredArgumentBuilder<S, T>;

/**
 * The core command dispatcher, for registering, parsing, and executing commands.
 *
 * @param <S> a custom "source" type, such as a user or originator of a command
 */
export declare class CommandDispatcher<S> {
	
    /**
     * Create a new {@link CommandDispatcher} with the specified root node.
     *
     * <p>This is often useful to copy existing or pre-defined command trees.</p>
     *
     * @param root the existing {@link RootCommandNode} to use as the basis for this tree
     */
    public CommandDispatcher(root: RootCommandNode<S>)

    /**
     * Creates a new {@link CommandDispatcher} with an empty command tree.
     */
    public CommandDispatcher()

    /**
     * Utility method for registering new commands.
     *
     * <p>This is a shortcut for calling {@link RootCommandNode#addChild(CommandNode)} after building the provided {@code command}.</p>
     *
     * <p>As {@link RootCommandNode} can only hold literals, this method will only allow literal arguments.</p>
     *
     * @param command a literal argument builder to add to this command tree
     * @return the node added to this tree
     */
    public register(command: LiteralArgumentBuilder<S>): LiteralCommandNode<S>

    /**
     * Sets a callback to be informed of the result of every command.
     *
     * @param consumer the new result consumer to be called
     */
    public setConsumer(consumer: ResultConsumer<S>): void

    /**
     * Parses and executes a given command.
     *
     * <p>This is a shortcut to first {@link #parse(StringReader, Object)} and then {@link #execute(ParseResults)}.</p>
     *
     * <p>It is recommended to parse and execute as separate steps, as parsing is often the most expensive step, and easiest to cache.</p>
     *
     * <p>If this command returns a value, then it successfully executed something. If it could not parse the command, or the execution was a failure,
     * then an exception will be thrown. Most exceptions will be of type {@link CommandSyntaxException}, but it is possible that a {@link RuntimeException}
     * may bubble up from the result of a command. The meaning behind the returned result is arbitrary, and will depend
     * entirely on what command was performed.</p>
     *
     * <p>If the command passes through a node that is {@link CommandNode#isFork()} then it will be 'forked'.
     * A forked command will not bubble up any {@link CommandSyntaxException}s, and the 'result' returned will turn into
     * 'amount of successful commands executes'.</p>
     *
     * <p>After each and any command is ran, a registered callback given to {@link #setConsumer(ResultConsumer)}
     * will be notified of the result and success of the command. You can use that method to gather more meaningful
     * results than this method will return, especially when a command forks.</p>
     *
     * @param input a command string to parse &amp execute
     * @param source a custom "source" object, usually representing the originator of this command
     * @return a numeric result from a "command" that was performed
     * @throws CommandSyntaxException if the command failed to parse or execute
     * @throws RuntimeException if the command failed to execute and was not handled gracefully
     * @see #parse(String, Object)
     * @see #parse(StringReader, Object)
     * @see #execute(ParseResults)
     * @see #execute(StringReader, Object)
     */
    public execute(input: string | StringReader, source: S): number

    /**
     * Executes a given pre-parsed command.
     *
     * <p>If this command returns a value, then it successfully executed something. If the execution was a failure,
     * then an exception will be thrown.
     * Most exceptions will be of type {@link CommandSyntaxException}, but it is possible that a {@link RuntimeException}
     * may bubble up from the result of a command. The meaning behind the returned result is arbitrary, and will depend
     * entirely on what command was performed.</p>
     *
     * <p>If the command passes through a node that is {@link CommandNode#isFork()} then it will be 'forked'.
     * A forked command will not bubble up any {@link CommandSyntaxException}s, and the 'result' returned will turn into
     * 'amount of successful commands executes'.</p>
     *
     * <p>After each and any command is ran, a registered callback given to {@link #setConsumer(ResultConsumer)}
     * will be notified of the result and success of the command. You can use that method to gather more meaningful
     * results than this method will return, especially when a command forks.</p>
     *
     * @param parse the result of a successful {@link #parse(StringReader, Object)}
     * @return a numeric result from a "command" that was performed.
     * @throws CommandSyntaxException if the command failed to parse or execute
     * @throws RuntimeException if the command failed to execute and was not handled gracefully
     * @see #parse(String, Object)
     * @see #parse(StringReader, Object)
     * @see #execute(String, Object)
     * @see #execute(StringReader, Object)
     */
    public execute(parse: ParseResults<S>): number

    /**
     * Parses a given command.
     *
     * <p>The result of this method can be cached, and it is advised to do so where appropriate. Parsing is often the
     * most expensive step, and this allows you to essentially "precompile" a command if it will be ran often.</p>
     *
     * <p>If the command passes through a node that is {@link CommandNode#isFork()} then the resulting context will be marked as 'forked'.
     * Forked contexts may contain child contexts, which may be modified by the {@link RedirectModifier} attached to the fork.</p>
     *
     * <p>Parsing a command can never fail, you will always be provided with a new {@link ParseResults}.
     * However, that does not mean that it will always parse into a valid command. You should inspect the returned results
     * to check for validity. If its {@link ParseResults#getReader()} {@link StringReader#canRead()} then it did not finish
     * parsing successfully. You can use that position as an indicator to the user where the command stopped being valid.
     * You may inspect {@link ParseResults#getExceptions()} if you know the parse failed, as it will explain why it could
     * not find any valid commands. It may contain multiple exceptions, one for each "potential node" that it could have visited,
     * explaining why it did not go down that node.</p>
     *
     * <p>When you eventually call {@link #execute(ParseResults)} with the result of this method, the above error checking
     * will occur. You only need to inspect it yourself if you wish to handle that yourself.</p>
     *
     * @param command a command string to parse
     * @param source a custom "source" object, usually representing the originator of this command
     * @return the result of parsing this command
     * @see #parse(StringReader, Object)
     * @see #execute(ParseResults)
     * @see #execute(String, Object)
     */
    public parse(command: string | StringReader, source: S): ParseResults<S>

    /**
     * Gets all possible executable commands following the given node.
     *
     * <p>You may use {@link #getRoot()} as a target to get all usage data for the entire command tree.</p>
     *
     * <p>The returned syntax will be in "simple" form: {@code <param>} and {@code literal}. "Optional" nodes will be
     * listed as multiple entries: the parent node, and the child nodes.
     * For example, a required literal "foo" followed by an optional param "int" will be two nodes:</p>
     * <ul>
     *     <li>{@code foo}</li>
     *     <li>{@code foo <int>}</li>
     * </ul>
     *
     * <p>The path to the specified node will <b>not</b> be prepended to the output, as there can theoretically be many
     * ways to reach a given node. It will only give you paths relative to the specified node, not absolute from root.</p>
     *
     * @param node target node to get child usage strings for
     * @param source a custom "source" object, usually representing the originator of this command
     * @param restricted if true, commands that the {@code source} cannot access will not be mentioned
     * @return array of full usage strings under the target node
     */
    public getAllUsage(node: CommandNode<S>, source: S, restricted: boolean): string[]

    /**
     * Gets the possible executable commands from a specified node.
     *
     * <p>You may use {@link #getRoot()} as a target to get usage data for the entire command tree.</p>
     *
     * <p>The returned syntax will be in "smart" form: {@code <param>}, {@code literal}, {@code [optional]} and {@code (either|or)}.
     * These forms may be mixed and matched to provide as much information about the child nodes as it can, without being too verbose.
     * For example, a required literal "foo" followed by an optional param "int" can be compressed into one string:</p>
     * <ul>
     *     <li>{@code foo [<int>]}</li>
     * </ul>
     *
     * <p>The path to the specified node will <b>not</b> be prepended to the output, as there can theoretically be many
     * ways to reach a given node. It will only give you paths relative to the specified node, not absolute from root.</p>
     *
     * <p>The returned usage will be restricted to only commands that the provided {@code source} can use.</p>
     *
     * @param node target node to get child usage strings for
     * @param source a custom "source" object, usually representing the originator of this command
     * @return array of full usage strings under the target node
     */
    public getSmartUsage(node: CommandNode<S>, source: S): Map<CommandNode<S>, String>

    /**
     * Gets suggestions for a parsed input string on what comes next.
     *
     * <p>As it is ultimately up to custom argument types to provide suggestions, it may be an asynchronous operation,
     * for example getting in-game data or player names etc. As such, this method returns a future and no guarantees
     * are made to when or how the future completes.</p>
     *
     * <p>The suggestions provided will be in the context of the end of the parsed input string, but may suggest
     * new or replacement strings for earlier in the input string. For example, if the end of the string was
     * {@code foobar} but an argument preferred it to be {@code minecraft:foobar}, it will suggest a replacement for that
     * whole segment of the input.</p>
     *
     * @param parse the result of a {@link #parse(StringReader, Object)}
     * @return a future that will eventually resolve into a {@link Suggestions} object
     */
    public getCompletionSuggestions(parse: ParseResults<S>): Promise<Suggestions>

    /**
     * Gets the root of this command tree.
     *
     * <p>This is often useful as a target of a {@link com.mojang.brigadier.builder.ArgumentBuilder#redirect(CommandNode)},
     * {@link #getAllUsage(CommandNode, Object, boolean)} or {@link #getSmartUsage(CommandNode, Object)}.
     * You may also use it to clone the command tree via {@link #CommandDispatcher(RootCommandNode)}.</p>
     *
     * @return root of the command tree
     */
    public getRoot(): RootCommandNode<S>

    /**
     * Finds a valid path to a given node on the command tree.
     *
     * <p>There may theoretically be multiple paths to a node on the tree, especially with the use of forking or redirecting.
     * As such, this method makes no guarantees about which path it finds. It will not look at forks or redirects,
     * and find the first instance of the target node on the tree.</p>
     *
     * <p>The only guarantee made is that for the same command tree and the same version of this library, the result of
     * this method will <b>always</b> be a valid input for {@link #findNode(Array)}, which should return the same node
     * as provided to this method.</p>
     *
     * @param target the target node you are finding a path for
     * @return a path to the resulting node, or an empty list if it was not found
     */
    public getPath(target: CommandNode<S>): Array<String>

    /**
     * Finds a node by its path
     *
     * <p>Paths may be generated with {@link #getPath(CommandNode)}, and are guaranteed (for the same tree, and the
     * same version of this library) to always produce the same valid node by this method.</p>
     *
     * <p>If a node could not be found at the specified path, then {@code null} will be returned.</p>
     *
     * @param path a generated path to a node
     * @return the node at the given path, or null if not found
     */
    public findNode(path: Array<String>): CommandNode<S>

    /**
     * Scans the command tree for potential ambiguous commands.
     *
     * <p>This is a shortcut for {@link CommandNode#findAmbiguities(AmbiguityConsumer)} on {@link #getRoot()}.</p>
     *
     * <p>Ambiguities are detected by testing every {@link CommandNode#getExamples()} on one node verses every sibling
     * node. This is not fool proof, and relies a lot on the providers of the used argument types to give good examples.</p>
     *
     * @param consumer a callback to be notified of potential ambiguities
     */
    public findAmbiguities(consumer: AmbiguityConsumer<S>): void    
}