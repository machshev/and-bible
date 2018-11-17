package net.bible.android.control.event.passage

/**
 * The verse has changed.
 *
 * @author Martin Denham [mjdenham at gmail dot com]
 * @see gnu.lgpl.License for license details.<br></br>
 * The copyright to this program is held by it's author.
 */
data class SynchronizeWindowsEvent(val syncAll: Boolean = false)