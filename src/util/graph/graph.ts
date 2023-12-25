import { unknownToString } from "../string";
import { dfs } from "./algorithms/search";

/**
 * Models a directed acyclic graph containing arbitrary vertices.
 */
export interface DirectedGraph<V, E extends DirectedEdge<V>> {
    /**
     * Inserts a vertex into the graph without connecting it to any existing vertex.
     *
     * @param vertex - the new vertex
     * @throws if the graph contains the vertex already
     */
    place(vertex: V): void;
    /**
     * Connects two vertices in the graph with an edge. If the graph does not yet contain the
     * vertices, they will automatically be inserted prior to the connection.
     *
     * @param source - the source vertex
     * @param destination - the destination vertex
     * @throws if the connection would introduce a duplicate edge or a cycle
     */
    connect(source: V, destination: V): void;
    /**
     * Searches for a specific vertex in the graph. Every vertex will be visited exactly once.
     *
     * @param filter - the filter function
     * @returns the first matching vertex or `null` if no vertex matches the filter function
     */
    find(filter: (vertex: V) => boolean): V | null;
    /**
     * Returns a generator which iterates through all vertices.
     *
     * @returns the generator
     */
    getVertices(): Generator<V>;
    /**
     * Returns a generator which iterates through all edges.
     *
     * @returns the generator
     */
    getEdges(): Generator<E>;
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
    size(set: "vertices" | "edges"): number;
    /**
     * Returns a generator which iterates through all outgoing edges of a vertex.
     *
     * @param vertex - the source vertex
     * @returns the generator
     */
    getOutgoing(vertex: V): Generator<E>;
    /**
     * Returns a generator which iterates through all incoming edges of a vertex.
     *
     * @param vertex - the destination vertex
     * @returns the generator
     */
    getIncoming(vertex: V): Generator<E>;
    /**
     * Returns whether a vertex has any outgoing edges.
     *
     * @param vertex - the source vertex
     * @returns `true` if the vertex has at least one outgoing edge, otherwise `false`
     */
    hasOutgoing(vertex: V): boolean;
    /**
     * Returns whether a vertex has any incoming edges.
     *
     * @param vertex - the destination vertex
     * @returns `true` if the vertex has at least one incoming edge, otherwise `false`
     */
    hasIncoming(vertex: V): boolean;
}

/**
 * Models a directed edge between two vertices.
 */
export interface DirectedEdge<V> {
    /**
     * Returns the edge's source vertex.
     *
     * @returns the source vertex
     */
    getSource(): V;
    /**
     * Returns the edge's destination vertex.
     *
     * @returns the destination vertex
     */
    getDestination(): V;
}

/**
 * A basic implementation of a directed edge.
 */
export class SimpleDirectedEdge<V> implements DirectedEdge<V> {
    /**
     * Constructs a new directed edge.
     *
     * @param source - the source vertex
     * @param destination - the destination vertex
     */
    constructor(private readonly source: V, private readonly destination: V) {
        this.source = source;
        this.destination = destination;
    }

    public getSource(): V {
        return this.source;
    }

    public getDestination(): V {
        return this.destination;
    }
}

/**
 * A basic implementation of a directed acyclic graph.
 */
export class SimpleDirectedGraph<V> implements DirectedGraph<V, DirectedEdge<V>> {
    private readonly outgoingEdges: Map<V, Set<DirectedEdge<V>>>;
    private readonly incomingEdges: Map<V, Set<DirectedEdge<V>>>;

    /**
     * Constructs an empty acyclic directed graph containing no vertices or edges.
     */
    constructor() {
        this.incomingEdges = new Map();
        this.outgoingEdges = new Map();
    }

    public place(vertex: V): void {
        if (this.outgoingEdges.has(vertex)) {
            throw new Error(`Duplicate vertex detected: ${unknownToString(vertex)}`);
        }
        this.initVertex(vertex);
    }

    public connect(source: V, destination: V): void {
        const sourceConnections = this.initVertex(source);
        const destinationConnections = this.initVertex(destination);
        if (dfs(this, { source: destination, destination: source })) {
            throw new Error(
                `Failed to connect vertices ${unknownToString(source)} -> ${unknownToString(
                    destination
                )}: cycle detected`
            );
        }
        for (const outgoingEdge of sourceConnections.outgoing) {
            if (outgoingEdge.getDestination() === destination) {
                throw new Error(
                    `Failed to connect vertices ${unknownToString(source)} -> ${unknownToString(
                        destination
                    )}: duplicate edge detected: ${unknownToString(outgoingEdge)}`
                );
            }
        }
        const edge = new SimpleDirectedEdge(source, destination);
        sourceConnections.outgoing.add(edge);
        destinationConnections.incoming.add(edge);
    }

    public find(filter: (vertex: V) => boolean): V | null {
        for (const vertex of this.getVertices()) {
            if (filter(vertex)) {
                return vertex;
            }
        }
        return null;
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

    public size(type: "vertices" | "edges"): number {
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

    private initVertex(vertex: V): {
        incoming: Set<DirectedEdge<V>>;
        outgoing: Set<DirectedEdge<V>>;
    } {
        let outgoing: Set<DirectedEdge<V>> | undefined = this.outgoingEdges.get(vertex);
        let incoming: Set<DirectedEdge<V>> | undefined = this.incomingEdges.get(vertex);
        if (!outgoing) {
            outgoing = new Set();
            this.outgoingEdges.set(vertex, outgoing);
        }
        if (!incoming) {
            incoming = new Set();
            this.incomingEdges.set(vertex, incoming);
        }
        return { incoming: incoming, outgoing: outgoing };
    }
}