import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react'
import { BiPlus, BiUser, BiSend, BiSolidUserCircle } from 'react-icons/bi'
import { MdOutlineArrowLeft, MdOutlineArrowRight } from 'react-icons/md'

const serverUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'https://chatbot-store-c419ab4c3ae7.herokuapp.com' // TODO

const fetchOptions = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer andrewcbuensalida',
  },
}

function App() {
  const [text, setText] = useState<any>('')
  const [allMessages, setAllMessages] = useState<any>([])
  const [currentConversationId, setCurrentConversationId] = useState<any>(
    Math.random().toString(36).substr(2, 9)
  )
  const [isResponseLoading, setIsResponseLoading] = useState<any>(false)
  const [errorText, setErrorText] = useState<any>('')
  const [isShowSidebar, setIsShowSidebar] = useState<any>(false)
  const scrollToLastItem = useRef<any>(null)
  const inputRef = useRef<any>(null)

  const currentMessages = allMessages.filter(
    (msg: any) => msg.conversationId === currentConversationId
  )
  const messagesToday = allMessages.filter(
    (msg: any) =>
      new Date(msg.created_at).toDateString() === new Date().toDateString()
  )
  const messagesNotToday = allMessages.filter(
    (msg: any) =>
      new Date(msg.created_at).toDateString() !== new Date().toDateString()
  )
  const conversationsToday = messagesToday.reduce((acc: any, msg: any) => {
    if (!acc[msg.conversationId]) {
      acc[msg.conversationId] = [msg]
    } else {
      acc[msg.conversationId].push(msg)
    }
    return acc
  }, {})
  const conversationsNotToday = messagesNotToday.reduce(
    (acc: any, msg: any) => {
      if (!acc[msg.conversationId]) {
        acc[msg.conversationId] = [msg]
      } else {
        acc[msg.conversationId].push(msg)
      }
      return acc
    },
    {}
  )
  console.log(`*Example conversationsNotToday: `, conversationsNotToday)

  const createNewChat = () => {
    setText('')
    setCurrentConversationId(Math.random().toString(36).substr(2, 9))
    inputRef.current?.focus()
  }

  const handleConversationClick = (conversationId: any) => {
    setCurrentConversationId(conversationId)
    setText('')
    inputRef.current?.focus()
  }

  const toggleSidebar = useCallback(() => {
    setIsShowSidebar((prev: any) => !prev)
  }, [])

  const submitHandler = async (e: any) => {
    console.log(`*Submitting message...`, currentConversationId)
    e.preventDefault()

    if (!text) return

    const messageId = Math.random().toString(36).substr(2, 9)
    const newUserMessage = {
      messageId,
      conversationId: currentConversationId,
      role: 'user',
      content: [
        {
          type: 'text',
          text,
        },
      ],
      createdAt: new Date().toISOString(),
      userId: '1',
    }
    // temporarily add the message to the list. This will be replaced by the actual response since setAllMessages below uses an outdated allMessages state.
    setAllMessages([...allMessages, newUserMessage])

    setTimeout(() => {
      scrollToLastItem.current?.lastElementChild?.scrollIntoView({
        behavior: 'smooth',
      })
    }, 1)
    setIsResponseLoading(true)
    setErrorText('')

    try {
      const response = await fetch(`${serverUrl}/`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify({
          message: newUserMessage,
        }),
      })

      if (response.status === 429) {
        return setErrorText('Too many requests, please try again later.')
      }

      const data = await response.json()

      if (data.error) {
        setErrorText(data.error.message)
        setText('')
      } else {
        setErrorText('')
      }

      if (!data.error) {
        setErrorText('')
        setTimeout(() => {
          scrollToLastItem.current?.lastElementChild?.scrollIntoView({
            behavior: 'smooth',
          })
        }, 1)
        setTimeout(() => {
          setText('')
        }, 2)

        const formattedMessage = {
          messageId: data.message.message_id,
          conversationId: data.message.conversation_id,
          role: 'assistant',
          content: data.message.content,
          userId: '1',
        }

        setAllMessages([...allMessages, newUserMessage,formattedMessage])
      }
    } catch (e: any) {
      setErrorText('Error sending message. Please try again later.')
      console.error(e)
    } finally {
      setIsResponseLoading(false)
    }
  }

  useLayoutEffect(() => {
    const handleResize = () => {
      setIsShowSidebar(window.innerWidth <= 640)
    }
    handleResize()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    async function getAllMessages() {
      try {
        console.log(`*Fetching previous messages...`)
        const response = await fetch(`${serverUrl}/api/messages/`, {
          // ...fetchOptions,
          method: 'GET',
        })
        const data = await response.json()
        console.log(`*Example data: `, data)
        const formattedMessages = data.messages.map((msg: any) => {
          return {
            ...msg,
            conversationId: msg.conversation_id,
            messageId: msg.message_id,
            content: JSON.parse(msg.content), // for some reason, backend saves it to single quotes. Have to turn it into double quotes to parse.
            // createdAt: new Date(msg.created_at).toISOString(),
          }
        })
        setAllMessages(formattedMessages)
      } catch (error) {
        console.error('Error fetching previous messages:', error)
      }
    }

    getAllMessages()
  }, [])

  return (
    <>
      <div className="container">
        <section className={`sidebar ${isShowSidebar ? 'open' : ''}`}>
          <div className="sidebar-header" onClick={createNewChat} role="button">
            <BiPlus size={20} />
            <button>New Chat</button>
          </div>
          <div className="sidebar-history">
            {Object.keys(conversationsToday).length > 0 && (
              <>
                <p>Today</p>
                <ul>
                  {Object.entries(conversationsToday)?.map(
                    ([conversationId, messages]: any) => {
                      return (
                        <li
                          key={conversationId}
                          onClick={() =>
                            handleConversationClick(conversationId)
                          }
                          className={`App_Unique_Title ${
                            conversationId === currentConversationId
                              ? 'active'
                              : ''
                          }`}
                        >
                          {messages[0].content[0].text}
                        </li>
                      )
                    }
                  )}
                </ul>
              </>
            )}
            {Object.keys(conversationsNotToday).length > 0 && (
              <>
                <p>Previous</p>
                <ul>
                  {Object.entries(conversationsNotToday)?.map(
                    ([conversationId, messages]: any) => {
                      return (
                        <li
                          key={conversationId}
                          onClick={() =>
                            handleConversationClick(conversationId)
                          }
                          className={`App_Unique_Title ${
                            conversationId === currentConversationId
                              ? 'active'
                              : ''
                          }`}
                        >
                          {messages[0].content[0].text}
                        </li>
                      )
                    }
                  )}
                </ul>
              </>
            )}
          </div>
          <div className="sidebar-info">
            <div className="sidebar-info-upgrade">
              <BiUser size={20} />
              <p>Upgrade plan</p>
            </div>
            <div className="sidebar-info-user">
              <BiSolidUserCircle size={20} />
              <p>User</p>
            </div>
          </div>
        </section>

        <section className="main">
          {currentMessages.length === 0 && (
            <div className="empty-chat-container">
              <img
                src="robot-assistant.png"
                width={45}
                height={45}
                alt="ChatGPT"
              />
              <h1>Store Assistant</h1>
              <h3>
                Say 'Get my orders' (Hint: Use customer ID 37077)
                <br />
                Say 'Get all orders'
                <br />
                Say 'What are the top 5 highly-rated guitar products?'
                <br />
                Say 'Is the BOYA BYM1 Microphone good for a cello?'
                <br />
              </h3>
            </div>
          )}

          {isShowSidebar ? (
            <MdOutlineArrowRight
              className="burger"
              size={28.8}
              onClick={toggleSidebar}
            />
          ) : (
            <MdOutlineArrowLeft
              className="burger"
              size={28.8}
              onClick={toggleSidebar}
            />
          )}
          <div className="main-header">
            <ul>
              {currentMessages?.map((chatMsg: any) => {
                const isUser = chatMsg.role === 'user'
                return (
                  <li key={chatMsg.messageId} ref={scrollToLastItem}>
                    {isUser ? (
                      <div>
                        <BiSolidUserCircle size={28.8} />
                      </div>
                    ) : (
                      <img
                        className="avatar"
                        src="robot-assistant.png"
                        alt="ChatGPT"
                      />
                    )}
                    {isUser ? (
                      <div>
                        <p className="role-title">You</p>
                        <p>{chatMsg.content[0].text}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="role-title">Store Assistant</p>
                        <p>
                          {chatMsg.content[0].text
                            ?.split('\n')
                            .map((line: any, index: any) => (
                              <p>
                                {line}
                                <br />
                              </p>
                            ))}
                        </p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="main-bottom">
            {errorText && <p className="errorText">{errorText}</p>}
            <form className="form-container" onSubmit={submitHandler}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Send a message."
                spellCheck="false"
                value={isResponseLoading ? 'Processing...' : text}
                onChange={(e) => setText(e.target.value)}
                readOnly={isResponseLoading}
              />
              {!isResponseLoading && (
                <button type="submit">
                  <BiSend size={20} />
                </button>
              )}
            </form>
            <p>
              ChatGPT can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}

export default App
