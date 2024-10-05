import { unknownToString } from "../string";
import { dfs } from "./algorithms/search";

/**
 * Models a directed acyclic graph containing arbitrary vertices.
 */
export interface DirectedGraph<V> {
    /**
     * Connects two vertices in the graph with an edge. The vertices must exist in the graph already
     * to connect them (using {@link place | `place`}).
     *
     * @param source - the source vertex
     * @param destination - the destination vertex
     * @returns the new edge
     * @throws if the graph does not contain one of the vertices or if the connection would
     * introduce a duplicate edge or a cycle
     */
    connect(source: V, destination: V): DirectedEdge<V>;
    /**
     * Searches for a specific vertex in the graph. Every vertex will be visited exactly once.
     *
     * @param filter - the filter function
     * @returns the first matching vertex or `undefined` if no vertex matches the filter function
     */
    find<T extends V>(filter: (vertex: V) => vertex is T): T | undefined;
    /**
     * Searches for a specific vertex in the graph. If no matching vertex can be found the fallback
     * function will be called instead. Every vertex will be visited exactly once.
     *
     * @param vertexClass - the vertex class type
     * @param fallback - the fallback function
     * @param filter - an additional vertex filter
     * @returns the first matching vertex or the result of the fallback function
     */
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    findOrDefault<T extends V, A extends unknown[]>(
        vertexClass: new (...args: A) => T,
        fallback: () => T,
        filter?: (vertex: T) => boolean
    ): T;
    /**
     * Returns a generator which iterates through all edges.
     *
     * @returns the generator
     */
    getEdges(): Generator<DirectedEdge<V>>;
    /**
     * Returns a generator which iterates through all incoming edges of a vertex.
     *
     * @param vertex - the destination vertex
     * @returns the generator
     */
    getIncoming(vertex: V): Generator<DirectedEdge<V>>;
    /**
     * Returns a generator which iterates through all outgoing edges of a vertex.
     *
     * @param vertex - the source vertex
     * @returns the generator
     */
    getOutgoing(vertex: V): Generator<DirectedEdge<V>>;
    /**
     * Returns a generator which iterates through all predecessors of a vertex, i.e. the source
     * vertices of all incoming edges.
     *
     * @param vertex - the vertex
     * @returns the generator
     */
    getPredecessors(vertex: V): Generator<V>;
    /**
     * Returns a generator which iterates through all successors of a vertex, i.e. the destination
     * vertices of all outgoing edges.
     *
     * @param vertex - the vertex
     * @returns the generator
     */
    getSuccessors(vertex: V): Generator<V>;
    /**
     * Returns a generator which iterates through all vertices.
     *
     * @returns the generator
     */
    getVertices(): Generator<V>;
    /**
     * Returns whether a vertex has any incoming edges.
     *
     * @param vertex - the destination vertex
     * @returns `true` if the vertex has at least one incoming edge, otherwise `false`
     */
    hasIncoming(vertex: V): boolean;
    /**
     * Returns whether a vertex has any outgoing edges.
     *
     * @param vertex - the source vertex
     * @returns `true` if the vertex has at least one outgoing edge, otherwise `false`
     */
    hasOutgoing(vertex: V): boolean;
    /**
     * Inserts a vertex into the graph without connecting it to any existing vertex.
     *
     * @param vertex - the new vertex
     * @returns the vertex
     * @throws if the graph contains the vertex already
     */
    place(vertex: V): V;
    /**
     * Returns the size of the graph. The size can either denote the number of vertices or the
     * number of edges (the cardinality of either set).
     *
     * Calling this function is guaranteed to be _at most_ as computationally expensive as counting
     * the vertices or edges using {@link getVertices | `getVertices`} or
     * {@link getEdges | `getEdges`}.
     *
     * @param set - the target set whose size to return
     * @returns the size
     */
    size(set: "edges" | "vertices"): number;
}

/**
 * Models a directed edge between two vertices.
 */
export interface DirectedEdge<S, D = S> {
    /**
     * Returns the edge's destination vertex.
     *
     * @returns the destination vertex
     */
    getDestination(): D;
    /**
     * Returns the edge's source vertex.
     *
     * @returns the source vertex
     */
    getSource(): S;
}

/**
 * A basic implementation of a directed edge.
 */
export class SimpleDirectedEdge<S, D> implements DirectedEdge<S, D> {
    private readonly source: S;
    private readonly destination: D;
    /**
     * Constructs a new directed edge.
     *
     * @param source - the source vertex
     * @param destination - the destination vertex
     */
    constructor(source: S, destination: D) {
        this.source = source;
        this.destination = destination;
    }

    public getSource(): S {
        return this.source;
    }

    public getDestination(): D {
        return this.destination;
    }
}

/**
 * A basic implementation of a directed acyclic graph.
 */
export class SimpleDirectedGraph<V> implements DirectedGraph<V> {
    private readonly outgoingEdges: Map<V, Set<DirectedEdge<V>>>;
    private readonly incomingEdges: Map<V, Set<DirectedEdge<V>>>;

    /**
     * Constructs an empty acyclic directed graph containing no vertices or edges.
     */
    constructor() {
        this.incomingEdges = new Map();
        this.outgoingEdges = new Map();
    }

    public place<T extends V>(vertex: T): T {
        if (this.outgoingEdges.has(vertex)) {
            throw new Error(`Duplicate vertex detected: ${unknownToString(vertex)}`);
        }
        this.outgoingEdges.set(vertex, new Set<DirectedEdge<V>>());
        this.incomingEdges.set(vertex, new Set<DirectedEdge<V>>());
        return vertex;
    }

    public connect<S extends V, D extends V>(source: S, destination: D): SimpleDirectedEdge<S, D> {
        if (!this.outgoingEdges.has(source)) {
            throw new Error("Failed to connect vertices: the source vertex does not exist");
        }
        if (!this.outgoingEdges.has(destination)) {
            throw new Error("Failed to connect vertices: the destination vertex does not exist");
        }
        if (dfs(this, { destination: source, source: destination })) {
            throw new Error(
                `Failed to connect vertices ${unknownToString(source)} -> ${unknownToString(
                    destination
                )}: cycle detected`
            );
        }
        for (const outgoingEdge of this.getOutgoing(source)) {
            if (outgoingEdge.getDestination() === destination) {
                throw new Error(
                    `Failed to connect vertices ${unknownToString(source)} -> ${unknownToString(
                        destination
                    )}: duplicate edge detected`
                );
            }
        }
        const edge = new SimpleDirectedEdge(source, destination);
        this.outgoingEdges.get(source)?.add(edge);
        this.incomingEdges.get(destination)?.add(edge);
        return edge;
    }

    public find<T extends V>(filter: (vertex: V) => vertex is T): T | undefined {
        for (const vertex of this.getVertices()) {
            if (filter(vertex)) {
                return vertex;
            }
        }
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    public findOrDefault<T extends V, A extends unknown[]>(
        vertexClass: new (...args: A) => T,
        fallback: () => T,
        filter?: (vertex: T) => boolean
    ): T {
        for (const vertex of this.getVertices()) {
            if (vertex instanceof vertexClass) {
                if (filter && !filter(vertex)) {
                    continue;
                }
                return vertex;
            }
        }
        return fallback();
    }

    public *getVertices(): Generator<V> {
        for (const vertex of this.outgoingEdges.keys()) {
            yield vertex;
        }
    }

    public *getEdges(): Generator<DirectedEdge<V>> {
        for (const outgoing of this.outgoingEdges.values()) {
            for (const edge of outgoing) {
                yield edge;
            }
        }
    }

    public size(type: "edges" | "vertices"): number {
        if (type === "vertices") {
            return this.outgoingEdges.size;
        }
        let count = 0;
        for (const outgoing of this.outgoingEdges.values()) {
            count += outgoing.size;
        }
        return count;
    }

    public *getOutgoing(vertex: V): Generator<DirectedEdge<V>> {
        const outgoing = this.outgoingEdges.get(vertex);
        if (outgoing === undefined) {
            throw new Error(`Unknown vertex: ${unknownToString(vertex)}`);
        }
        for (const edge of outgoing) {
            yield edge;
        }
    }

    public *getIncoming(vertex: V): Generator<DirectedEdge<V>> {
        const incoming = this.incomingEdges.get(vertex);
        if (incoming == undefined) {
            throw new Error(`Unknown vertex: ${unknownToString(vertex)}`);
        }
        for (const edge of incoming) {
            yield edge;
        }
    }

    public hasOutgoing(vertex: V): boolean {
        const outgoing = this.outgoingEdges.get(vertex);
        if (outgoing === undefined) {
            throw new Error(`Unknown vertex: ${unknownToString(vertex)}`);
        }
        return outgoing.size > 0;
    }

    public hasIncoming(vertex: V): boolean {
        const incoming = this.incomingEdges.get(vertex);
        if (incoming === undefined) {
            throw new Error(`Unknown vertex: ${unknownToString(vertex)}`);
        }
        return incoming.size > 0;
    }

    public *getPredecessors(vertex: V): Generator<V> {
        for (const edge of this.getIncoming(vertex)) {
            yield edge.getSource();
        }
    }

    public *getSuccessors(vertex: V): Generator<V> {
        for (const edge of this.getOutgoing(vertex)) {
            yield edge.getDestination();
        }
    }
}
